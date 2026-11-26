package io.github.progliodario.playlistplayer.player

import android.net.Uri
import okhttp3.OkHttpClient
import okhttp3.RequestBody.Companion.toRequestBody
import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.ServiceList
import org.schabi.newpipe.extractor.downloader.Downloader
import org.schabi.newpipe.extractor.downloader.Request
import org.schabi.newpipe.extractor.downloader.Response
import org.schabi.newpipe.extractor.exceptions.ReCaptchaException
import org.schabi.newpipe.extractor.localization.ContentCountry
import org.schabi.newpipe.extractor.localization.Localization
import org.schabi.newpipe.extractor.stream.DeliveryMethod
import org.schabi.newpipe.extractor.stream.StreamInfo
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

/** Shared HTTP client. YouTube's stream servers refuse unknown User-Agents. */
object Http {
    const val USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; rv:140.0) Gecko/20100101 Firefox/140.0"

    val client: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }
}

/** Streams of one video: audio only, plus an HLS manifest with the picture when available. */
data class ResolvedStream(val audioUrl: String, val hlsUrl: String?, val expiresAtMs: Long)

/**
 * Finds the streams of a video with NewPipeExtractor (https://github.com/TeamNewPipe/
 * NewPipeExtractor), the library of the NewPipe app: no YouTube player, so no ads.
 * When YouTube changes and playback breaks, updating the library version in
 * android/app/build.gradle is usually the fix. Results are cached until the URLs expire.
 */
object StreamResolver {
    private const val EXPIRY_MARGIN_MS = 30 * 60 * 1000L
    private const val DEFAULT_LIFETIME_MS = 4 * 60 * 60 * 1000L

    private val cache = ConcurrentHashMap<String, ResolvedStream>()

    @Volatile
    private var initialized = false

    /** Blocking (network): call it from a background thread. */
    @Throws(IOException::class)
    fun resolve(videoId: String, refresh: Boolean = false): ResolvedStream {
        if (!refresh) {
            cache[videoId]?.takeIf { it.expiresAtMs > System.currentTimeMillis() }?.let { return it }
        }
        ensureInitialized()
        val info = try {
            StreamInfo.getInfo(ServiceList.YouTube, "https://www.youtube.com/watch?v=$videoId")
        } catch (error: IOException) {
            throw error
        } catch (error: Exception) {
            throw IOException("Cannot read video $videoId", error)
        }
        val audio = info.audioStreams
            .filter { it.isUrl && it.deliveryMethod == DeliveryMethod.PROGRESSIVE_HTTP }
            .maxByOrNull { it.averageBitrate }
            ?: throw IOException("No audio stream for $videoId")
        val audioUrl = audio.content
        val expire = Uri.parse(audioUrl).getQueryParameter("expire")?.toLongOrNull()
        val resolved = ResolvedStream(
            audioUrl = audioUrl,
            hlsUrl = info.hlsUrl?.takeIf { it.isNotEmpty() },
            expiresAtMs = expire?.let { it * 1000 - EXPIRY_MARGIN_MS }
                ?: (System.currentTimeMillis() + DEFAULT_LIFETIME_MS),
        )
        cache[videoId] = resolved
        return resolved
    }

    fun invalidate(videoId: String) {
        cache.remove(videoId)
    }

    private fun ensureInitialized() {
        if (initialized) return
        synchronized(this) {
            if (!initialized) {
                NewPipe.init(OkHttpDownloader(Http.client), Localization("it", "IT"), ContentCountry("IT"))
                initialized = true
            }
        }
    }
}

/** NewPipeExtractor's network access, through OkHttp. */
private class OkHttpDownloader(private val client: OkHttpClient) : Downloader() {
    override fun execute(request: Request): Response {
        val body = request.dataToSend()?.toRequestBody()
        val builder = okhttp3.Request.Builder()
            .url(request.url())
            .method(request.httpMethod(), body)
            .header("User-Agent", Http.USER_AGENT)
        for ((name, values) in request.headers()) {
            builder.removeHeader(name)
            for (value in values) builder.addHeader(name, value)
        }
        client.newCall(builder.build()).execute().use { response ->
            if (response.code == 429) {
                throw ReCaptchaException("reCAPTCHA challenge requested", request.url())
            }
            return Response(
                response.code,
                response.message,
                response.headers.toMultimap(),
                response.body.string(),
                response.request.url.toString(),
            )
        }
    }
}
