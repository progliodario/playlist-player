package io.github.progliodario.playlistplayer.player.ui

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.LruCache
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import io.github.progliodario.playlistplayer.player.Http
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Decorative image (YouTube thumbnail) loaded with the app's OkHttp client and kept in a
 * small memory cache. No image library: the player screen needs only thumbnails.
 * Until it loads (or if it fails) the box just shows the modifier's background.
 */
@Composable
fun RemoteImage(url: String?, modifier: Modifier = Modifier, contentScale: ContentScale = ContentScale.Crop) {
    val bitmap by produceState(initialValue = url?.let(ThumbnailCache::get), url) {
        if (url != null && value == null) value = ThumbnailCache.load(url)
    }
    val image = bitmap
    if (image == null) {
        Box(modifier)
    } else {
        Image(
            bitmap = image.asImageBitmap(),
            contentDescription = null,
            contentScale = contentScale,
            modifier = modifier,
        )
    }
}

private object ThumbnailCache {
    /** About 16 MB of decoded thumbnails. */
    private val cache = object : LruCache<String, Bitmap>(16 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Bitmap) = value.byteCount
    }

    fun get(url: String): Bitmap? = cache.get(url)

    suspend fun load(url: String): Bitmap? = withContext(Dispatchers.IO) {
        runCatching {
            val request = okhttp3.Request.Builder().url(url).build()
            Http.client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@use null
                BitmapFactory.decodeStream(response.body.byteStream())
            }
        }.getOrNull()?.also { cache.put(url, it) }
    }
}
