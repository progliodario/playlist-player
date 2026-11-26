package io.github.progliodario.playlistplayer.player.ui

import android.graphics.Color as AndroidColor
import androidx.annotation.OptIn
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.IconToggleButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import io.github.progliodario.playlistplayer.R
import io.github.progliodario.playlistplayer.player.PlayerActions
import io.github.progliodario.playlistplayer.player.PlayerUiState
import io.github.progliodario.playlistplayer.player.QueueRow
import kotlinx.coroutines.delay

/**
 * Native player screen: cover (or video), title, seek bar, controls and the whole queue.
 * Phones: one scrolling column. Wide screens (tablets, landscape): player | queue.
 * Accessibility: every control has a spoken name and state, touch targets are >= 48 dp,
 * text scales with the system font size, the track title is a polite live region.
 */
@Composable
fun PlayerScreen(ui: PlayerUiState, actions: PlayerActions) {
    LaunchedEffect(ui.player) {
        while (ui.player != null) {
            ui.tick()
            delay(500)
        }
    }
    val wide = LocalConfiguration.current.screenWidthDp >= 720
    Box(
        Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    0f to Night.SkyTop,
                    0.35f to Night.SkyMid,
                    0.7f to Night.Background,
                    1f to Night.Background,
                ),
            ),
    ) {
        Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)) {
            TopBar(ui, actions)
            when {
                ui.queue.isEmpty() -> EmptyState(actions)
                wide -> Row(
                    Modifier.fillMaxSize().padding(horizontal = 24.dp),
                    horizontalArrangement = Arrangement.spacedBy(32.dp),
                ) {
                    Column(
                        Modifier.weight(1f).verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) { NowPlaying(ui, actions) }
                    LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(bottom = 24.dp)) {
                        queueItems(ui, actions)
                    }
                }
                else -> LazyColumn(
                    Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    item { NowPlaying(ui, actions) }
                    queueItems(ui, actions)
                }
            }
        }
    }
}

@Composable
private fun TopBar(ui: PlayerUiState, actions: PlayerActions) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = actions::back) {
            Icon(
                painterResource(R.drawable.ic_back),
                contentDescription = stringResource(R.string.player_back),
                tint = Night.Text,
            )
        }
        Column(Modifier.weight(1f).padding(end = 16.dp)) {
            Text(
                stringResource(R.string.player_now_playing).uppercase(),
                style = MaterialTheme.typography.labelMedium,
                color = Night.AccentStrong,
                letterSpacing = 1.5.sp,
            )
            ui.playlistTitle?.let {
                Text(
                    it,
                    style = MaterialTheme.typography.titleMedium,
                    color = Night.Text,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun EmptyState(actions: PlayerActions) {
    Column(
        Modifier.fillMaxSize().padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            stringResource(R.string.player_empty),
            style = MaterialTheme.typography.headlineSmall,
            fontFamily = FontFamily.Serif,
            color = Night.Text,
            modifier = Modifier.semantics { heading() },
        )
        Spacer(Modifier.height(8.dp))
        Text(
            stringResource(R.string.player_empty_hint),
            color = Night.TextMuted,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(24.dp))
        FilledIconButton(
            onClick = actions::back,
            modifier = Modifier.size(64.dp),
            colors = IconButtonDefaults.filledIconButtonColors(
                containerColor = Night.Accent,
                contentColor = Night.AccentInk,
            ),
        ) {
            Icon(painterResource(R.drawable.ic_back), contentDescription = stringResource(R.string.player_back))
        }
    }
}

@Composable
private fun NowPlaying(ui: PlayerUiState, actions: PlayerActions) {
    Column(
        Modifier.fillMaxWidth().widthIn(max = 560.dp).padding(top = 8.dp, bottom = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Artwork(ui)
        Spacer(Modifier.height(24.dp))
        Text(
            ui.title,
            style = MaterialTheme.typography.headlineSmall,
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.Bold,
            color = Night.Text,
            textAlign = TextAlign.Center,
            maxLines = 3,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.semantics {
                heading()
                liveRegion = LiveRegionMode.Polite
            },
        )
        if (ui.artist.isNotEmpty()) {
            Text(
                ui.artist,
                style = MaterialTheme.typography.titleMedium,
                color = Night.TextMuted,
                textAlign = TextAlign.Center,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
        if (ui.hasError) {
            Spacer(Modifier.height(8.dp))
            Text(
                stringResource(R.string.player_error),
                color = Night.Danger,
                textAlign = TextAlign.Center,
                modifier = Modifier.semantics { liveRegion = LiveRegionMode.Assertive },
            )
        }
        Spacer(Modifier.height(16.dp))
        SeekBar(ui, actions)
        Controls(ui, actions)
        Spacer(Modifier.height(8.dp))
        FilterChip(
            selected = ui.videoOn,
            onClick = actions::toggleVideo,
            label = { Text(stringResource(R.string.player_show_video)) },
            leadingIcon = {
                Icon(
                    painterResource(R.drawable.ic_video),
                    contentDescription = null,
                    modifier = Modifier.size(FilterChipDefaults.IconSize),
                )
            },
            colors = FilterChipDefaults.filterChipColors(
                containerColor = Night.Surface2,
                labelColor = Night.Text,
                iconColor = Night.TextMuted,
                selectedContainerColor = Night.Surface3,
                selectedLabelColor = Night.Text,
                selectedLeadingIconColor = Night.AccentStrong,
            ),
        )
    }
}

@OptIn(UnstableApi::class)
@Composable
private fun Artwork(ui: PlayerUiState) {
    val player = ui.player
    if (ui.videoOn && ui.showsVideo && player != null) {
        val description = stringResource(R.string.player_video_description, ui.title)
        AndroidView(
            factory = { context ->
                PlayerView(context).apply {
                    useController = false
                    resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                    setShutterBackgroundColor(AndroidColor.TRANSPARENT)
                    this.player = player
                }
            },
            update = { it.player = ui.player },
            onRelease = { it.player = null },
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 9f)
                .clip(RoundedCornerShape(20.dp))
                .background(Color.Black)
                .semantics { contentDescription = description },
        )
    } else {
        RemoteImage(
            url = ui.artworkUri?.toString(),
            modifier = Modifier
                .fillMaxWidth(0.78f)
                .widthIn(max = 360.dp)
                .aspectRatio(1f)
                .shadow(28.dp, RoundedCornerShape(28.dp), ambientColor = Night.Accent, spotColor = Night.Violet)
                .clip(RoundedCornerShape(28.dp))
                .background(Night.Surface2),
        )
    }
}

@Composable
private fun SeekBar(ui: PlayerUiState, actions: PlayerActions) {
    var dragging by remember { mutableStateOf<Float?>(null) }
    val duration = ui.durationMs
    val fraction = dragging ?: if (duration > 0) (ui.positionMs.toFloat() / duration).coerceIn(0f, 1f) else 0f
    val shownPosition = if (duration > 0) (fraction * duration).toLong() else ui.positionMs
    val positionText = formatTime(shownPosition)
    val durationText = formatTime(duration)
    val label = stringResource(R.string.player_seek)
    val state = stringResource(R.string.player_seek_value, positionText, durationText)
    Column(Modifier.fillMaxWidth()) {
        Slider(
            value = fraction,
            onValueChange = { dragging = it },
            onValueChangeFinished = {
                dragging?.let { actions.seekTo((it * duration).toLong()) }
                dragging = null
            },
            enabled = duration > 0,
            colors = SliderDefaults.colors(
                thumbColor = Night.Accent,
                activeTrackColor = Night.Accent,
                inactiveTrackColor = Night.Surface3,
            ),
            modifier = Modifier.fillMaxWidth().semantics {
                contentDescription = label
                stateDescription = state
            },
        )
        Row(Modifier.fillMaxWidth().clearAndSetSemantics {}) {
            Text(positionText, color = Night.TextMuted, style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.weight(1f))
            Text(durationText, color = Night.TextMuted, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
private fun Controls(ui: PlayerUiState, actions: PlayerActions) {
    val shuffleLabel = stringResource(R.string.player_shuffle)
    val repeatLabel = stringResource(
        when (ui.repeatMode) {
            Player.REPEAT_MODE_ALL -> R.string.player_repeat_all
            Player.REPEAT_MODE_ONE -> R.string.player_repeat_one
            else -> R.string.player_repeat_off
        },
    )
    Row(
        Modifier.fillMaxWidth().padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconToggleButton(
            checked = ui.shuffle,
            onCheckedChange = { actions.toggleShuffle() },
            modifier = Modifier.semantics { contentDescription = shuffleLabel },
        ) {
            Icon(
                painterResource(R.drawable.ic_shuffle),
                contentDescription = null,
                tint = if (ui.shuffle) Night.AccentStrong else Night.TextMuted,
            )
        }
        IconButton(onClick = actions::previous) {
            Icon(
                painterResource(R.drawable.ic_skip_previous),
                contentDescription = stringResource(R.string.player_previous),
                tint = Night.Text,
                modifier = Modifier.size(32.dp),
            )
        }
        FilledIconButton(
            onClick = actions::playPause,
            modifier = Modifier.size(76.dp),
            colors = IconButtonDefaults.filledIconButtonColors(
                containerColor = Night.Accent,
                contentColor = Night.AccentInk,
            ),
        ) {
            val label = stringResource(if (ui.isPlaying) R.string.player_pause else R.string.player_play)
            if (ui.isBuffering && !ui.isPlaying) {
                CircularProgressIndicator(
                    color = Night.AccentInk,
                    strokeWidth = 3.dp,
                    modifier = Modifier.size(36.dp).semantics { contentDescription = label },
                )
            } else {
                Icon(
                    painterResource(if (ui.isPlaying) R.drawable.ic_pause else R.drawable.ic_play),
                    contentDescription = label,
                    modifier = Modifier.size(40.dp),
                )
            }
        }
        IconButton(onClick = actions::next) {
            Icon(
                painterResource(R.drawable.ic_skip_next),
                contentDescription = stringResource(R.string.player_next),
                tint = Night.Text,
                modifier = Modifier.size(32.dp),
            )
        }
        IconButton(onClick = actions::cycleRepeat) {
            Icon(
                painterResource(
                    if (ui.repeatMode == Player.REPEAT_MODE_ONE) R.drawable.ic_repeat_one else R.drawable.ic_repeat,
                ),
                contentDescription = repeatLabel,
                tint = if (ui.repeatMode == Player.REPEAT_MODE_OFF) Night.TextMuted else Night.AccentStrong,
            )
        }
    }
}

private fun LazyListScope.queueItems(ui: PlayerUiState, actions: PlayerActions) {
    item {
        Text(
            stringResource(R.string.player_queue),
            style = MaterialTheme.typography.titleLarge,
            fontFamily = FontFamily.Serif,
            color = Night.Text,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 8.dp)
                .semantics { heading() },
        )
    }
    itemsIndexed(ui.queue, key = { index, row -> "$index-${row.videoId}" }) { index, row ->
        QueueItem(row, current = index == ui.currentIndex, onClick = { actions.playAt(index) })
    }
}

@Composable
private fun QueueItem(row: QueueRow, current: Boolean, onClick: () -> Unit) {
    val currentLabel = stringResource(R.string.player_current)
    Row(
        Modifier
            .fillMaxWidth()
            .widthIn(max = 720.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(if (current) Night.Surface2 else Color.Transparent)
            .selectable(selected = current, onClick = onClick, role = Role.Button)
            .semantics { if (current) stateDescription = currentLabel }
            .padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        RemoteImage(
            url = "https://i.ytimg.com/vi/${row.videoId}/mqdefault.jpg",
            modifier = Modifier.size(56.dp).clip(RoundedCornerShape(10.dp)).background(Night.Surface3),
        )
        Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
            Text(
                row.title,
                color = if (current) Night.AccentStrong else Night.Text,
                fontWeight = if (current) FontWeight.Bold else FontWeight.Medium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            if (row.artist.isNotEmpty()) {
                Text(
                    row.artist,
                    color = Night.TextMuted,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
        row.durationSeconds?.let {
            Text(formatTime(it * 1000), color = Night.TextMuted, style = MaterialTheme.typography.labelMedium)
        }
    }
}

/** 0:05, 3:07, 1:02:03 */
internal fun formatTime(ms: Long): String {
    val totalSeconds = (ms.coerceAtLeast(0) / 1000)
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return if (hours > 0) {
        "%d:%02d:%02d".format(hours, minutes, seconds)
    } else {
        "%d:%02d".format(minutes, seconds)
    }
}
