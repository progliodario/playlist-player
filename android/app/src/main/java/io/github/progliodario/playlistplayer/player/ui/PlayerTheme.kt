package io.github.progliodario.playlistplayer.player.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/**
 * "Notturno" colors of the web app (src/styles/tokens.css), for the native player screen.
 * Text/background pairs are the ones already contrast-checked in the web app (WCAG AA).
 */
object Night {
    val Background = Color(0xFF0D0A1F)
    val Surface = Color(0xFF17122F)
    val Surface2 = Color(0xFF211A42)
    val Surface3 = Color(0xFF2D2457)
    val Text = Color(0xFFF8F4FF)
    val TextMuted = Color(0xFFCFC6EE)
    val Accent = Color(0xFFFF6AA8)
    val AccentStrong = Color(0xFFFF9CC8)
    val AccentInk = Color(0xFF1B0B24)
    val Violet = Color(0xFF9B7BFF)
    val Gold = Color(0xFFFFC65C)
    val Danger = Color(0xFFFF8F8F)
    val SkyTop = Color(0xFF0B0726)
    val SkyMid = Color(0xFF26105C)
    val SkyBottom = Color(0xFF5D1A73)
}

@Composable
fun PlayerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Night.Accent,
            onPrimary = Night.AccentInk,
            secondary = Night.Violet,
            tertiary = Night.Gold,
            background = Night.Background,
            onBackground = Night.Text,
            surface = Night.Surface,
            onSurface = Night.Text,
            surfaceVariant = Night.Surface2,
            onSurfaceVariant = Night.TextMuted,
            secondaryContainer = Night.Surface3,
            onSecondaryContainer = Night.Text,
            error = Night.Danger,
        ),
        content = content,
    )
}
