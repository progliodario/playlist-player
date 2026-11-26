package io.github.progliodario.playlistplayer.player

import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.addCallback
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.content.ContextCompat
import androidx.core.os.bundleOf
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionToken
import com.google.androidbrowserhelper.trusted.LauncherActivity
import com.google.common.util.concurrent.ListenableFuture
import io.github.progliodario.playlistplayer.player.ui.PlayerScreen
import io.github.progliodario.playlistplayer.player.ui.PlayerTheme

/**
 * Player screen of the Android app. The web app (inside the Trusted Web Activity) opens it
 * with intent://play/#Intent;scheme=playlistplayer;...;S.payload=<queue JSON>;end
 * (src/platform/android-player.ts), or with intent://open/... to just show it.
 * Playback itself lives in [PlaybackService]; this screen is a MediaController.
 */
class PlayerActivity : ComponentActivity() {

    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var controller: MediaController? = null
    private val ui = PlayerUiState()
    private var pendingPayload: String? = null

    /** The user's choice for the picture; null = default (on for video playlists). */
    private var videoChoice: Boolean? = null

    private val actions = object : PlayerActions {
        override fun playPause() {
            val player = controller ?: return
            if (player.isPlaying) {
                player.pause()
                return
            }
            if (player.playbackState == Player.STATE_IDLE) player.prepare()
            if (player.playbackState == Player.STATE_ENDED) player.seekToDefaultPosition()
            player.play()
        }

        override fun next() {
            controller?.seekToNextMediaItem()
        }

        override fun previous() {
            val player = controller ?: return
            if (player.currentPosition > RESTART_THRESHOLD_MS) player.seekTo(0) else player.seekToPreviousMediaItem()
        }

        override fun seekTo(positionMs: Long) {
            controller?.seekTo(positionMs)
        }

        override fun toggleShuffle() {
            controller?.let { it.shuffleModeEnabled = !it.shuffleModeEnabled }
        }

        override fun cycleRepeat() {
            controller?.let {
                it.repeatMode = when (it.repeatMode) {
                    Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
                    Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
                    else -> Player.REPEAT_MODE_OFF
                }
            }
        }

        override fun playAt(index: Int) {
            val player = controller ?: return
            player.seekTo(index, 0)
            if (player.playbackState == Player.STATE_IDLE) player.prepare()
            player.play()
        }

        override fun toggleVideo() {
            videoChoice = !(videoChoice ?: ui.playlistIsVideo)
            sendVideoWanted()
        }

        override fun back() = backToLibrary()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        if (savedInstanceState == null) pendingPayload = payloadOf(intent)
        ui.onPlaylistKindChanged = {
            videoChoice = null
            sendVideoWanted()
        }
        onBackPressedDispatcher.addCallback(this) { backToLibrary() }
        setContent {
            PlayerTheme {
                PlayerScreen(ui = ui, actions = actions)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        payloadOf(intent)?.let {
            pendingPayload = it
            sendPendingPayload()
        }
    }

    override fun onStart() {
        super.onStart()
        val token = SessionToken(this, ComponentName(this, PlaybackService::class.java))
        val future = MediaController.Builder(this, token).buildAsync()
        controllerFuture = future
        future.addListener(
            {
                if (controllerFuture !== future) return@addListener
                val connected = runCatching { future.get() }.getOrNull() ?: return@addListener
                controller = connected
                ui.attach(connected)
                sendPendingPayload()
                sendVideoWanted()
            },
            ContextCompat.getMainExecutor(this),
        )
    }

    override fun onStop() {
        // Releasing the controller tells the service the screen is gone: it continues
        // with audio only (see PlaybackService.SessionCallback.onDisconnected).
        ui.detach()
        controllerFuture?.let { MediaController.releaseFuture(it) }
        controllerFuture = null
        controller = null
        super.onStop()
    }

    private fun payloadOf(intent: Intent?): String? {
        val data = intent?.data ?: return null
        if (data.scheme != URL_SCHEME || data.host != "play") return null
        return intent.getStringExtra(PlaybackService.ARG_PAYLOAD)
    }

    private fun sendPendingPayload() {
        val payload = pendingPayload ?: return
        val player = controller ?: return
        pendingPayload = null
        videoChoice = null
        player.sendCustomCommand(
            SessionCommand(PlaybackService.COMMAND_HANDOFF, Bundle.EMPTY),
            bundleOf(PlaybackService.ARG_PAYLOAD to payload),
        )
    }

    private fun sendVideoWanted() {
        val on = videoChoice ?: ui.playlistIsVideo
        ui.videoOn = on
        controller?.sendCustomCommand(
            SessionCommand(PlaybackService.COMMAND_SET_VIDEO, Bundle.EMPTY),
            bundleOf(PlaybackService.ARG_ON to on),
        )
    }

    /** Back to the web app (the Trusted Web Activity), starting it if it is not open. */
    private fun backToLibrary() {
        if (isTaskRoot) startActivity(Intent(this, LauncherActivity::class.java))
        finish()
    }

    private companion object {
        const val URL_SCHEME = "playlistplayer"
        const val RESTART_THRESHOLD_MS = 3_000L
    }
}
