/**
 * Contract between the web app and the Windows app (desktop/preload.cjs).
 * The desktop app exposes this object as `window.playlistPlayerDesktop`; keep both sides
 * in sync (desktop/main/ipc.cjs implements the calls).
 */

export interface ResolvedMedia {
  /** Audio-only stream, served by the desktop app itself (ppstream:// URL). */
  audioSrc: string;
  /** HLS manifest with video and audio, when the video is wanted and available. */
  hlsUrl: string | null;
  /** Duration in seconds (0 when unknown). */
  durationSeconds: number;
  title: string;
}

export interface DesktopAccessToken {
  accessToken: string;
  /** Lifetime in seconds. */
  expiresIn: number;
}

export interface DesktopBridge {
  /** Version of the Windows app (not of the web app). */
  version: string;
  /** Finds the streams of a video. Rejects when the video cannot be played. */
  resolve(videoId: string, options: { video: boolean; refresh?: boolean }): Promise<ResolvedMedia>;
  /** Resolves a video in the background so that it starts instantly later. */
  prefetch(videoId: string): void;
  /**
   * Google sign-in in the system browser (Google does not allow it inside embedded
   * browsers). Resolves with a read-only access token.
   */
  signIn(options: {
    clientId: string;
    scope: string;
    prompt: '' | 'consent' | 'select_account';
  }): Promise<DesktopAccessToken>;
}

declare global {
  interface Window {
    playlistPlayerDesktop?: DesktopBridge;
  }
}
