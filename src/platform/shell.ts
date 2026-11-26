/**
 * Where the web app is running. The same site is used in three "shells":
 *
 *  - web:     a normal browser tab or the installed PWA. Playback uses the official YouTube
 *             player (the only option a web page has).
 *  - android: inside the Android app (Trusted Web Activity). The APK opens the site with
 *             `?shell=android`; playback is handed off to the app's native player
 *             (android/app/src/main/java/.../player/), which plays with the screen off and
 *             without ads.
 *  - desktop: inside the Windows app (desktop/, Electron). Its preload script exposes
 *             `window.playlistPlayerDesktop`; playback uses <video> with streams resolved by
 *             yt-dlp (src/player/stream-player-engine.ts).
 *
 * See docs/sviluppo/app-native.md.
 */
import type { DesktopBridge } from './desktop-bridge.ts';

export type Shell = 'web' | 'android' | 'desktop';

/** Query parameter set by the Android app's launch URL (android/app/build.gradle). */
export const SHELL_QUERY_PARAM = 'shell';
const SESSION_KEY = 'pp:shell';

let cached: Shell | null = null;

export function getShell(): Shell {
  if (cached) return cached;
  cached = detectShell();
  return cached;
}

function detectShell(): Shell {
  if (typeof window === 'undefined') return 'web';
  if (getDesktopBridge()) return 'desktop';
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(SHELL_QUERY_PARAM);
    // sessionStorage keeps the answer for the whole app session (the query parameter is
    // only on the first page load) without leaking into normal Chrome tabs.
    if (fromUrl === 'android') sessionStorage.setItem(SESSION_KEY, 'android');
    if (sessionStorage.getItem(SESSION_KEY) === 'android') return 'android';
  } catch {
    // storage disabled: fall back to the plain web behaviour
  }
  return 'web';
}

export function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === 'undefined') return null;
  return window.playlistPlayerDesktop ?? null;
}

/** Test helper: forget the detected shell. */
export function resetShellForTests(): void {
  cached = null;
}
