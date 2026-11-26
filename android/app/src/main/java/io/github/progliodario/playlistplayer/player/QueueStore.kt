package io.github.progliodario.playlistplayer.player

import android.content.Context

/**
 * Saves the queue of the native player (same JSON as the web hand-off, HandoffJson) so it
 * comes back after the app or the phone restarts.
 */
class QueueStore(context: Context) {
    private val prefs = context.getSharedPreferences("player-queue", Context.MODE_PRIVATE)

    fun save(queue: Handoff) {
        prefs.edit().putString(KEY, HandoffJson.toJson(queue)).apply()
    }

    fun load(): Handoff? = prefs.getString(KEY, null)?.let(HandoffJson::parse)

    private companion object {
        const val KEY = "queue-v1"
    }
}
