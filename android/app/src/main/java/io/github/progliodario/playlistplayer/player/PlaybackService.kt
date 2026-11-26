package io.github.progliodario.playlistplayer.player

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.annotation.OptIn
import androidx.core.os.bundleOf
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.Timeline
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.HttpDataSource
import androidx.media3.datasource.ResolvingDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.ShuffleOrder
import androidx.media3.session.DefaultMediaNotificationProvider
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionError
import androidx.media3.session.SessionResult
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import io.github.progliodario.playlistplayer.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.IOException
import kotlin.random.Random

/**
 * The native player: an ExoPlayer inside a MediaSessionService, so it keeps playing with
 * the screen off and shows its controls in the notification, on the lock screen and on
 * Bluetooth devices. No YouTube player is involved, so there are no ads.
 *
 * Items use the URI yt://youtube/<videoId>/<audio|video>; [resolve] turns it into the real
 * stream URL (StreamResolver) only when ExoPlayer needs it. The queue is saved
 * (QueueStore) and restored, paused, when the service starts again.
 */
@OptIn(UnstableApi::class)
class PlaybackService : MediaSessionService() {

    private var session: MediaSession? = null
    private lateinit var player: ExoPlayer
    private lateinit var store: QueueStore
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val handler = Handler(Looper.getMainLooper())

    /** Tracks of the queue, in the same order as the player's media items. */
    private var tracks: List<QueueTrack> = emptyList()
    private var playlistTitle: String? = null
    private var playlistIsVideo = false
    /** The player screen is visible and wants the picture. */
    private var videoWanted = false
    /** Controller of the player screen that asked for the picture. */
    private var videoController: MediaSession.ControllerInfo? = null
    private var consecutiveErrors = 0
    private val retriedIds = mutableSetOf<String>()

    private val saveTicker = object : Runnable {
        override fun run() {
            if (player.isPlaying) save()
            handler.postDelayed(this, SAVE_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        store = QueueStore(this)
        val http = OkHttpDataSource.Factory(Http.client).setUserAgent(Http.USER_AGENT)
        val dataSource = ResolvingDataSource.Factory(DefaultDataSource.Factory(this, http)) { spec ->
            resolve(spec)
        }
        player = ExoPlayer.Builder(this)
            .setMediaSourceFactory(DefaultMediaSourceFactory(dataSource))
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA)
                    .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                    .build(),
                /* handleAudioFocus = */ true,
            )
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_NETWORK)
            .build()
        player.addListener(PlayerListener())
        session = MediaSession.Builder(this, player)
            .setSessionActivity(playerScreenIntent(this))
            .setCallback(SessionCallback())
            .build()
        setMediaNotificationProvider(
            DefaultMediaNotificationProvider.Builder(this).build().apply {
                setSmallIcon(R.drawable.ic_notification)
            },
        )
        store.load()?.let { apply(it.copy(autoplay = false)) }
        handler.postDelayed(saveTicker, SAVE_INTERVAL_MS)
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = session

    override fun onTaskRemoved(rootIntent: Intent?) {
        // Swiping the app away keeps the music going; when paused, the service can stop.
        if (!player.playWhenReady || player.mediaItemCount == 0) stopSelf()
    }

    override fun onDestroy() {
        save()
        handler.removeCallbacksAndMessages(null)
        scope.cancel()
        session?.release()
        session = null
        player.release()
        super.onDestroy()
    }

    // --- queue -----------------------------------------------------------------------

    private fun apply(handoff: Handoff) {
        tracks = handoff.tracks
        playlistTitle = handoff.title
        playlistIsVideo = handoff.isVideo
        consecutiveErrors = 0
        retriedIds.clear()
        player.setMediaItems(tracks.map { mediaItem(it, video = false) }, handoff.start, handoff.positionMs)
        player.repeatMode = handoff.repeat
        player.shuffleModeEnabled = handoff.shuffle
        if (handoff.shuffle && handoff.order != null) {
            player.setShuffleOrder(ShuffleOrder.DefaultShuffleOrder(handoff.order.toIntArray(), Random.nextLong()))
        }
        player.prepare()
        player.playWhenReady = handoff.autoplay
        updateVideoMode()
        prefetchNext()
        save()
    }

    private fun mediaItem(track: QueueTrack, video: Boolean): MediaItem =
        MediaItem.Builder()
            .setMediaId(track.videoId)
            .setUri(Uri.parse("$SCHEME://youtube/${track.videoId}/${if (video) "video" else "audio"}"))
            .setMimeType(if (video) MimeTypes.APPLICATION_M3U8 else null)
            .setMediaMetadata(
                MediaMetadata.Builder()
                    .setTitle(track.title.ifEmpty { track.videoId })
                    .setArtist(track.artist)
                    .setAlbumTitle(playlistTitle)
                    .setArtworkUri(Uri.parse("https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg"))
                    .setExtras(
                        bundleOf(
                            EXTRA_SHOWS_VIDEO to video,
                            EXTRA_PLAYLIST_IS_VIDEO to playlistIsVideo,
                            EXTRA_DURATION_SECONDS to (track.durationSeconds ?: -1L),
                        ),
                    )
                    .build(),
            )
            .build()

    /** Called by ExoPlayer on a loading thread: yt://youtube/<id>/<mode> -> stream URL. */
    private fun resolve(spec: DataSpec): DataSpec {
        val uri = spec.uri
        if (uri.scheme != SCHEME) return spec
        val segments = uri.pathSegments
        val videoId = segments.getOrNull(0) ?: throw IOException("Missing video id")
        val stream = StreamResolver.resolve(videoId)
        val target = if (segments.getOrNull(1) == "video") stream.hlsUrl ?: stream.audioUrl else stream.audioUrl
        return spec.withUri(Uri.parse(target))
    }

    /** Shows the picture of the current track only while the player screen wants it. */
    private fun updateVideoMode() {
        val index = player.currentMediaItemIndex
        val track = tracks.getOrNull(index) ?: return
        val showsVideo = player.currentMediaItem?.mediaMetadata?.extras?.getBoolean(EXTRA_SHOWS_VIDEO) == true
        if (videoWanted == showsVideo) return
        val want = videoWanted
        scope.launch {
            if (want) {
                val hls = withContext(Dispatchers.IO) {
                    runCatching { StreamResolver.resolve(track.videoId).hlsUrl }.getOrNull()
                }
                if (hls == null) return@launch // no picture available: stay audio only
            }
            if (player.currentMediaItemIndex != index || videoWanted != want) return@launch
            val position = player.currentPosition
            player.replaceMediaItem(index, mediaItem(track, video = want))
            player.seekTo(index, position)
        }
    }

    /** Resolves the next track in the background so that it starts without a pause. */
    private fun prefetchNext() {
        val next = player.nextMediaItemIndex
        val track = tracks.getOrNull(next) ?: return
        scope.launch(Dispatchers.IO) { runCatching { StreamResolver.resolve(track.videoId) } }
    }

    private fun save() {
        if (tracks.isEmpty()) return
        val order = if (player.shuffleModeEnabled) shuffleOrder() else null
        store.save(
            Handoff(
                title = playlistTitle,
                isVideo = playlistIsVideo,
                start = player.currentMediaItemIndex.coerceIn(0, tracks.size - 1),
                positionMs = player.currentPosition.coerceAtLeast(0),
                shuffle = order != null,
                order = order,
                repeat = player.repeatMode,
                autoplay = false,
                tracks = tracks,
            ),
        )
    }

    /** Current shuffle order, as indices of the items. */
    private fun shuffleOrder(): List<Int>? {
        val timeline = player.currentTimeline
        if (timeline.isEmpty) return null
        val order = ArrayList<Int>(timeline.windowCount)
        var index = timeline.getFirstWindowIndex(true)
        while (index != C.INDEX_UNSET && order.size < timeline.windowCount) {
            order.add(index)
            index = timeline.getNextWindowIndex(index, Player.REPEAT_MODE_OFF, true)
        }
        return order.takeIf { it.size == timeline.windowCount }
    }

    /** New shuffle order that starts with the current track, so every track is played. */
    private fun shuffleFromCurrent() {
        val count = player.mediaItemCount
        if (count < 2) return
        val current = player.currentMediaItemIndex
        val rest = (0 until count).filter { it != current }.shuffled()
        player.setShuffleOrder(ShuffleOrder.DefaultShuffleOrder((listOf(current) + rest).toIntArray(), Random.nextLong()))
    }

    private inner class PlayerListener : Player.Listener {
        override fun onIsPlayingChanged(isPlaying: Boolean) {
            if (isPlaying) consecutiveErrors = 0
            save()
        }

        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
            updateVideoMode()
            prefetchNext()
            save()
        }

        override fun onShuffleModeEnabledChanged(shuffleModeEnabled: Boolean) {
            if (shuffleModeEnabled) shuffleFromCurrent()
            save()
        }

        override fun onRepeatModeChanged(repeatMode: Int) = save()

        override fun onTimelineChanged(timeline: Timeline, reason: Int) {
            if (reason == Player.TIMELINE_CHANGE_REASON_PLAYLIST_CHANGED) prefetchNext()
        }

        override fun onPlayerError(error: PlaybackException) {
            val videoId = player.currentMediaItem?.mediaId ?: return
            if (isExpiredUrl(error) && retriedIds.add(videoId)) {
                // Stream URLs expire after a few hours: look the video up again once.
                StreamResolver.invalidate(videoId)
                player.prepare()
                return
            }
            consecutiveErrors++
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS || !player.hasNextMediaItem()) return
            handler.postDelayed({
                if (player.currentMediaItem?.mediaId == videoId) {
                    player.seekToNextMediaItem()
                    player.prepare()
                    player.play()
                }
            }, SKIP_DELAY_MS)
        }
    }

    private fun isExpiredUrl(error: PlaybackException): Boolean {
        var cause: Throwable? = error.cause
        while (cause != null) {
            if (cause is HttpDataSource.InvalidResponseCodeException) {
                return cause.responseCode == 403 || cause.responseCode == 410
            }
            cause = cause.cause
        }
        return false
    }

    private inner class SessionCallback : MediaSession.Callback {
        override fun onConnect(
            session: MediaSession,
            controller: MediaSession.ControllerInfo,
        ): MediaSession.ConnectionResult {
            val commands = MediaSession.ConnectionResult.DEFAULT_SESSION_COMMANDS.buildUpon()
            // Only this app may hand off queues or switch the picture on and off.
            if (controller.packageName == packageName) {
                commands.add(SessionCommand(COMMAND_HANDOFF, Bundle.EMPTY))
                commands.add(SessionCommand(COMMAND_SET_VIDEO, Bundle.EMPTY))
            }
            return MediaSession.ConnectionResult.AcceptedResultBuilder(session)
                .setAvailableSessionCommands(commands.build())
                .build()
        }

        override fun onCustomCommand(
            session: MediaSession,
            controller: MediaSession.ControllerInfo,
            customCommand: SessionCommand,
            args: Bundle,
        ): ListenableFuture<SessionResult> {
            when (customCommand.customAction) {
                COMMAND_HANDOFF -> {
                    val handoff = args.getString(ARG_PAYLOAD)?.let(HandoffJson::parse)
                        ?: return Futures.immediateFuture(SessionResult(SessionError.ERROR_BAD_VALUE))
                    apply(handoff)
                }
                COMMAND_SET_VIDEO -> {
                    videoWanted = args.getBoolean(ARG_ON)
                    videoController = controller
                    updateVideoMode()
                }
                else -> return Futures.immediateFuture(SessionResult(SessionError.ERROR_NOT_SUPPORTED))
            }
            return Futures.immediateFuture(SessionResult(SessionResult.RESULT_SUCCESS))
        }

        override fun onDisconnected(session: MediaSession, controller: MediaSession.ControllerInfo) {
            // The player screen went away (screen off, other app): keep playing, audio only.
            if (controller == videoController) {
                videoController = null
                videoWanted = false
                updateVideoMode()
            }
        }
    }

    companion object {
        const val SCHEME = "yt"
        const val COMMAND_HANDOFF = "io.github.progliodario.playlistplayer.HANDOFF"
        const val COMMAND_SET_VIDEO = "io.github.progliodario.playlistplayer.SET_VIDEO"
        const val ARG_PAYLOAD = "payload"
        const val ARG_ON = "on"
        const val EXTRA_SHOWS_VIDEO = "showsVideo"
        const val EXTRA_PLAYLIST_IS_VIDEO = "playlistIsVideo"
        const val EXTRA_DURATION_SECONDS = "durationSeconds"

        private const val SAVE_INTERVAL_MS = 10_000L
        private const val SKIP_DELAY_MS = 1_200L
        private const val MAX_CONSECUTIVE_ERRORS = 5

        fun playerScreenIntent(context: Context): PendingIntent = PendingIntent.getActivity(
            context,
            0,
            Intent(context, PlayerActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    }
}
