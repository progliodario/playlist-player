package io.github.progliodario.playlistplayer.player

import androidx.media3.common.Player
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** The payload format is shared with src/domain/handoff-payload.ts (web app). */
class HandoffJsonTest {

    private val payload = """
        {"v":1,"title":"Mix","kind":"video","start":1,"position":12.5,"shuffle":true,
         "order":[1,2,0],"repeat":"all","autoplay":true,
         "tracks":[["video000000","Song 0","Artist 0",100],
                   ["video000001","Song 1","Artist 1",null],
                   ["video000002","Song 2","",200]]}
    """.trimIndent()

    @Test
    fun parsesTheWebPayload() {
        val handoff = HandoffJson.parse(payload)!!
        assertEquals("Mix", handoff.title)
        assertTrue(handoff.isVideo)
        assertEquals(1, handoff.start)
        assertEquals(12_500L, handoff.positionMs)
        assertTrue(handoff.shuffle)
        assertEquals(listOf(1, 2, 0), handoff.order)
        assertEquals(Player.REPEAT_MODE_ALL, handoff.repeat)
        assertEquals(3, handoff.tracks.size)
        assertEquals(QueueTrack("video000001", "Song 1", "Artist 1", null), handoff.tracks[1])
    }

    @Test
    fun roundTripsThroughToJson() {
        val handoff = HandoffJson.parse(payload)!!
        assertEquals(handoff, HandoffJson.parse(HandoffJson.toJson(handoff)))
    }

    @Test
    fun rejectsInvalidPayloads() {
        assertNull(HandoffJson.parse("not json"))
        assertNull(HandoffJson.parse("""{"v":2,"tracks":[["video000000","a","b",1]]}"""))
        assertNull(HandoffJson.parse("""{"v":1,"tracks":[]}"""))
        assertNull(HandoffJson.parse("""{"v":1,"tracks":[["../../etc","a","b",1]]}"""))
    }

    @Test
    fun ignoresAnOrderThatIsNotAPermutation() {
        val handoff = HandoffJson.parse(payload.replace("[1,2,0]", "[1,1,0]"))!!
        assertNull(handoff.order)
        assertFalse(handoff.shuffle)
    }

    @Test
    fun clampsTheStartIndex() {
        assertEquals(2, HandoffJson.parse(payload.replace("\"start\":1", "\"start\":9"))!!.start)
    }
}
