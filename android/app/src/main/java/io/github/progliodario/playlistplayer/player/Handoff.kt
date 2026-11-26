package io.github.progliodario.playlistplayer.player

import androidx.media3.common.Player
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

/**
 * The queue the web app hands to the native player (and the shape the player saves it in).
 *
 * The JSON format is defined by src/domain/handoff-payload.ts in the web app: keep the two
 * files in sync. Tracks are arrays [videoId, title, artist, durationSeconds or null].
 */
data class QueueTrack(
    val videoId: String,
    val title: String,
    val artist: String,
    val durationSeconds: Long?,
)

data class Handoff(
    val title: String?,
    /** The playlist is shown as "video" in the web app: show the picture by default. */
    val isVideo: Boolean,
    /** Index into [tracks] of the track to start with. */
    val start: Int,
    val positionMs: Long,
    val shuffle: Boolean,
    /** Play order when shuffled (indices into [tracks]), or null. */
    val order: List<Int>?,
    /** One of Player.REPEAT_MODE_*. */
    val repeat: Int,
    val autoplay: Boolean,
    val tracks: List<QueueTrack>,
)

object HandoffJson {
    const val VERSION = 1
    private val VIDEO_ID = Regex("^[\\w-]{11}$")

    /** Returns null for anything that is not a valid version-1 payload. */
    fun parse(json: String): Handoff? = try {
        parseOrThrow(JSONObject(json))
    } catch (_: JSONException) {
        null
    } catch (_: IllegalArgumentException) {
        null
    }

    private fun parseOrThrow(root: JSONObject): Handoff? {
        if (root.optInt("v") != VERSION) return null
        val array = root.getJSONArray("tracks")
        val tracks = (0 until array.length()).map { i ->
            val item = array.getJSONArray(i)
            val videoId = item.getString(0)
            require(VIDEO_ID.matches(videoId)) { "Invalid video id" }
            QueueTrack(
                videoId = videoId,
                title = item.optString(1),
                artist = item.optString(2),
                durationSeconds = if (item.isNull(3)) null else item.optLong(3),
            )
        }
        if (tracks.isEmpty()) return null
        val order = root.optJSONArray("order")?.let { list ->
            (0 until list.length()).map { list.getInt(it) }
        }?.takeIf { it.size == tracks.size && it.toSet() == tracks.indices.toSet() }
        return Handoff(
            title = if (root.isNull("title")) null else root.optString("title").ifEmpty { null },
            isVideo = root.optString("kind") == "video",
            start = root.optInt("start").coerceIn(0, tracks.size - 1),
            positionMs = (root.optDouble("position", 0.0).coerceAtLeast(0.0) * 1000).toLong(),
            shuffle = root.optBoolean("shuffle") && order != null,
            order = order,
            repeat = when (root.optString("repeat")) {
                "all" -> Player.REPEAT_MODE_ALL
                "one" -> Player.REPEAT_MODE_ONE
                else -> Player.REPEAT_MODE_OFF
            },
            autoplay = root.optBoolean("autoplay", true),
            tracks = tracks,
        )
    }

    fun toJson(handoff: Handoff): String {
        val root = JSONObject()
        root.put("v", VERSION)
        root.put("title", handoff.title ?: JSONObject.NULL)
        root.put("kind", if (handoff.isVideo) "video" else "music")
        root.put("start", handoff.start)
        root.put("position", handoff.positionMs / 1000.0)
        root.put("shuffle", handoff.shuffle)
        root.put("order", handoff.order?.let { JSONArray(it) } ?: JSONObject.NULL)
        root.put(
            "repeat",
            when (handoff.repeat) {
                Player.REPEAT_MODE_ALL -> "all"
                Player.REPEAT_MODE_ONE -> "one"
                else -> "off"
            },
        )
        root.put("autoplay", handoff.autoplay)
        val tracks = JSONArray()
        for (track in handoff.tracks) {
            tracks.put(
                JSONArray()
                    .put(track.videoId)
                    .put(track.title)
                    .put(track.artist)
                    .put(track.durationSeconds ?: JSONObject.NULL),
            )
        }
        root.put("tracks", tracks)
        return root.toString()
    }
}
