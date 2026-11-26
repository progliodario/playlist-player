package io.github.progliodario.playlistplayer.player

import android.net.Uri
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.media3.common.C
import androidx.media3.common.Player

/** One row of the queue shown by the player screen. */
data class QueueRow(
    val videoId: String,
    val title: String,
    val artist: String,
    val durationSeconds: Long?,
)

/** What the player screen needs to know, as Compose state, read from the MediaController. */
class PlayerUiState {
    var player by mutableStateOf<Player?>(null)
        private set
    var title by mutableStateOf("")
        private set
    var artist by mutableStateOf("")
        private set
    var artworkUri by mutableStateOf<Uri?>(null)
        private set
    var playlistTitle by mutableStateOf<String?>(null)
        private set
    var playlistIsVideo by mutableStateOf(false)
        private set
    /** The current item is playing with its picture (HLS). */
    var showsVideo by mutableStateOf(false)
        private set
    /** The picture is switched on (user choice, or default for video playlists). */
    var videoOn by mutableStateOf(false)
    var isPlaying by mutableStateOf(false)
        private set
    var isBuffering by mutableStateOf(false)
        private set
    var positionMs by mutableStateOf(0L)
        private set
    var durationMs by mutableStateOf(0L)
        private set
    var shuffle by mutableStateOf(false)
        private set
    var repeatMode by mutableStateOf(Player.REPEAT_MODE_OFF)
        private set
    var queue by mutableStateOf<List<QueueRow>>(emptyList())
        private set
    var currentIndex by mutableStateOf(0)
        private set
    var hasError by mutableStateOf(false)
        private set

    /** Called when the playlist changes between music and video. */
    var onPlaylistKindChanged: (() -> Unit)? = null

    private val listener = object : Player.Listener {
        override fun onEvents(player: Player, events: Player.Events) {
            refresh(player, rebuildQueue = events.contains(Player.EVENT_TIMELINE_CHANGED))
        }
    }

    fun attach(player: Player) {
        this.player = player
        player.addListener(listener)
        refresh(player, rebuildQueue = true)
    }

    fun detach() {
        player?.removeListener(listener)
        player = null
    }

    /** Updates the position (called twice a second while the screen is visible). */
    fun tick() {
        val player = player ?: return
        positionMs = player.currentPosition.coerceAtLeast(0)
        val duration = player.duration
        durationMs = if (duration != C.TIME_UNSET && duration > 0) {
            duration
        } else {
            (queue.getOrNull(currentIndex)?.durationSeconds ?: 0L) * 1000
        }
    }

    private fun refresh(player: Player, rebuildQueue: Boolean) {
        if (rebuildQueue) {
            queue = (0 until player.mediaItemCount).map { index ->
                val item = player.getMediaItemAt(index)
                val metadata = item.mediaMetadata
                QueueRow(
                    videoId = item.mediaId,
                    title = metadata.title?.toString().orEmpty().ifEmpty { item.mediaId },
                    artist = metadata.artist?.toString().orEmpty(),
                    durationSeconds = metadata.extras
                        ?.getLong(PlaybackService.EXTRA_DURATION_SECONDS, -1L)
                        ?.takeIf { it > 0 },
                )
            }
        }
        val item = player.currentMediaItem
        val metadata = item?.mediaMetadata
        title = metadata?.title?.toString().orEmpty().ifEmpty { item?.mediaId.orEmpty() }
        artist = metadata?.artist?.toString().orEmpty()
        artworkUri = metadata?.artworkUri
        playlistTitle = metadata?.albumTitle?.toString()
        val extras = metadata?.extras
        val isVideoPlaylist = extras?.getBoolean(PlaybackService.EXTRA_PLAYLIST_IS_VIDEO) == true
        val kindChanged = item != null && isVideoPlaylist != playlistIsVideo
        playlistIsVideo = isVideoPlaylist
        showsVideo = extras?.getBoolean(PlaybackService.EXTRA_SHOWS_VIDEO) == true
        isPlaying = player.isPlaying
        isBuffering = player.playbackState == Player.STATE_BUFFERING
        shuffle = player.shuffleModeEnabled
        repeatMode = player.repeatMode
        currentIndex = player.currentMediaItemIndex
        hasError = player.playerError != null
        tick()
        if (kindChanged) onPlaylistKindChanged?.invoke()
    }
}

/** What the user can do on the player screen. */
interface PlayerActions {
    fun playPause()
    fun next()
    fun previous()
    fun seekTo(positionMs: Long)
    fun toggleShuffle()
    fun cycleRepeat()
    fun playAt(index: Int)
    fun toggleVideo()
    fun back()
}
