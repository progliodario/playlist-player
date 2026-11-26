/**
 * The single embedded YouTube player of the app.
 *
 * Responsibilities: create the iframe lazily inside the host element provided by the
 * UI (<PlayerViewport/>), load/play/pause/seek, and forward player events.
 * It knows nothing about queues or playlists: that is src/player/player-store.ts.
 *
 * YouTube policy reminders (docs/sviluppo/regole-youtube.md):
 *  - the player must stay visible and at least 200x200 px while playing;
 *  - never hide it to play "audio only", never download or cache media.
 */
import { basePlayerVars, loadYouTubeIframeApi } from './youtube-iframe-api.ts';

export interface PlayerEngineListener {
  onStateChange(state: number): void;
  onError(code: number): void;
}

class YouTubePlayerEngine {
  private host: HTMLElement | null = null;
  private player: YT.Player | null = null;
  private playerReady: Promise<YT.Player> | null = null;
  private listener: PlayerEngineListener | null = null;
  private volume = 100;
  private muted = false;
  /** Accessible name of the iframe (WCAG 4.1.2: frames need a title). */
  private title = 'YouTube';

  /** Called once by <PlayerViewport/> with a DOM node React will never re-render. */
  attach(host: HTMLElement): void {
    this.host = host;
  }

  setListener(listener: PlayerEngineListener): void {
    this.listener = listener;
  }

  /** Sets the iframe title read by screen readers (kept across iframe creation). */
  setTitle(title: string): void {
    this.title = title;
    this.player?.getIframe()?.setAttribute('title', title);
  }

  get isCreated(): boolean {
    return this.player !== null;
  }

  /** Loads a video. `autoplay` false only cues it (shows the thumbnail, no sound). */
  async load(videoId: string, startSeconds = 0, autoplay = true): Promise<void> {
    const player = await this.ensurePlayer();
    const request = { videoId, startSeconds: Math.max(0, Math.floor(startSeconds)) };
    if (autoplay) player.loadVideoById(request);
    else player.cueVideoById(request);
  }

  play(): void {
    this.player?.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  stop(): void {
    this.player?.stopVideo();
  }

  seekTo(seconds: number): void {
    this.player?.seekTo(Math.max(0, seconds), true);
  }

  setVolume(volume: number): void {
    this.volume = volume;
    this.player?.setVolume(volume);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.player) return;
    if (muted) this.player.mute();
    else this.player.unMute();
  }

  getCurrentTime(): number {
    return this.player?.getCurrentTime?.() ?? 0;
  }

  getDuration(): number {
    return this.player?.getDuration?.() ?? 0;
  }

  /** Title reported by the player for the current video (useful when ours is missing). */
  getVideoTitle(): string {
    const data = (
      this.player as (YT.Player & { getVideoData?: () => { title?: string } }) | null
    )?.getVideoData?.();
    return data?.title ?? '';
  }

  private ensurePlayer(): Promise<YT.Player> {
    if (this.playerReady) return this.playerReady;
    this.playerReady = (async () => {
      const api = await loadYouTubeIframeApi();
      if (!this.host) throw new Error('Player host not attached');
      const target = document.createElement('div');
      this.host.replaceChildren(target);
      return new Promise<YT.Player>((resolve) => {
        const player = new api.Player(target, {
          width: '100%',
          height: '100%',
          playerVars: basePlayerVars(),
          events: {
            onReady: () => {
              this.player = player;
              player.getIframe()?.setAttribute('title', this.title);
              player.setVolume(this.volume);
              if (this.muted) player.mute();
              resolve(player);
            },
            onStateChange: (event) => this.listener?.onStateChange(event.data),
            onError: (event) => this.listener?.onError(event.data),
          },
        });
      });
    })();
    this.playerReady.catch(() => {
      this.playerReady = null;
    });
    return this.playerReady;
  }
}

/** The app-wide player instance. */
export const playerEngine = new YouTubePlayerEngine();
