/**
 * The playback engine of this session, chosen once at startup.
 *
 *  - "youtube": official YouTube IFrame player (browsers, PWA, or when the user picks
 *               "YouTube player" in Settings inside an app). See youtube-player-engine.ts.
 *  - "stream":  Windows app, ad-free: <video> playing streams resolved by the app.
 *               See stream-player-engine.ts and desktop/.
 *  - "android": Android app, ad-free: nothing plays in the page; the queue is handed off
 *               to the native player (src/platform/android-player.ts).
 *
 * Every engine reports states with the YT_STATE numbers so that player-store.ts does not
 * care which one is running. Changing the setting reloads the page (see SettingsView).
 */
import { getDesktopBridge, getShell, type Shell } from '../platform/shell.ts';
import { useSettingsStore, type PlaybackMode } from '../state/settings-store.ts';
import { StreamPlayerEngine } from './stream-player-engine.ts';
import { YouTubePlayerEngine } from './youtube-player-engine.ts';

export interface PlayerEngineListener {
  /** One of YT_STATE (src/player/youtube-iframe-api.ts). */
  onStateChange(state: number): void;
  /** YouTube error code, or STREAM_ERROR_UNAVAILABLE for the stream engine. */
  onError(code: number): void;
}

export interface LoadOptions {
  /** Show the video picture (video playlists) or play audio only (music). */
  video: boolean;
}

export interface PlayerEngine {
  /** Called once by <PlayerViewport/> with a DOM node React will never re-render. */
  attach(host: HTMLElement): void;
  setListener(listener: PlayerEngineListener): void;
  /** Accessible name of the player element. */
  setTitle(title: string): void;
  readonly isCreated: boolean;
  load(
    videoId: string,
    startSeconds: number,
    autoplay: boolean,
    options: LoadOptions,
  ): Promise<void>;
  /** Optional: prepare the next video so it starts without delay. */
  prefetch?(videoId: string): void;
  play(): void;
  pause(): void;
  stop(): void;
  seekTo(seconds: number): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
}

export type PlaybackTarget = 'youtube' | 'stream' | 'android';

/** Which engine runs in a shell with the user's playback preference. */
export function choosePlaybackTarget(shell: Shell, mode: PlaybackMode): PlaybackTarget {
  if (mode === 'youtube' || shell === 'web') return 'youtube';
  return shell === 'android' ? 'android' : 'stream';
}

export const playbackTarget: PlaybackTarget = choosePlaybackTarget(
  getShell(),
  useSettingsStore.getState().playbackMode,
);

const bridge = getDesktopBridge();

/** The app-wide engine instance. */
export const playerEngine: PlayerEngine =
  playbackTarget === 'stream' && bridge
    ? new StreamPlayerEngine(bridge)
    : new YouTubePlayerEngine();
