/**
 * Ad-free engine of the Windows app: a plain <video> element.
 *
 * The desktop app (desktop/main/) finds the streams of each video with yt-dlp and serves
 * the audio through its own `ppstream://` protocol; video playlists use the HLS manifest,
 * played with hls.js (loaded only here, so normal browsers never download it).
 * States are reported with the YT_STATE numbers, like the YouTube engine.
 */
import type HlsType from 'hls.js';
import { videoThumbnailUrl } from '../domain/youtube-urls.ts';
import type { DesktopBridge, ResolvedMedia } from '../platform/desktop-bridge.ts';
import type { LoadOptions, PlayerEngine, PlayerEngineListener } from './player-engine.ts';
import { YT_STATE } from './youtube-iframe-api.ts';

/** Error code reported when a video cannot be played (shown like YouTube's 150). */
export const STREAM_ERROR_UNAVAILABLE = 1000;

export class StreamPlayerEngine implements PlayerEngine {
  private readonly bridge: DesktopBridge;
  private host: HTMLElement | null = null;
  private media: HTMLVideoElement | null = null;
  private hls: HlsType | null = null;
  private listener: PlayerEngineListener | null = null;
  private volume = 100;
  private muted = false;
  private title = '';
  /** Incremented by every load(): async work of an older load is dropped. */
  private loadToken = 0;
  private current: { videoId: string; options: LoadOptions } | null = null;
  /** One automatic retry per video (stream URLs expire after a few hours). */
  private retried = false;
  /** What the app wants; 'pause' events fired by loading a new source are ignored. */
  private wantsPlay = false;

  constructor(bridge: DesktopBridge) {
    this.bridge = bridge;
  }

  attach(host: HTMLElement): void {
    this.host = host;
  }

  setListener(listener: PlayerEngineListener): void {
    this.listener = listener;
  }

  setTitle(title: string): void {
    this.title = title;
    this.media?.setAttribute('aria-label', title);
  }

  get isCreated(): boolean {
    return this.media !== null;
  }

  async load(
    videoId: string,
    startSeconds: number,
    autoplay: boolean,
    options: LoadOptions,
  ): Promise<void> {
    const token = ++this.loadToken;
    this.current = { videoId, options };
    this.retried = false;
    this.wantsPlay = autoplay;
    const media = this.ensureMedia();
    this.reset(media);
    // Posters ignore object-fit: for music the cover is a CSS background (cover-sized).
    const cover = videoThumbnailUrl(videoId, 'hq');
    media.classList.toggle('is-audio', !options.video);
    if (options.video) {
      media.poster = cover;
      media.style.backgroundImage = '';
    } else {
      media.removeAttribute('poster');
      media.style.backgroundImage = `url("${cover}")`;
    }
    this.listener?.onStateChange(YT_STATE.BUFFERING);

    let resolved: ResolvedMedia;
    try {
      resolved = await this.bridge.resolve(videoId, { video: options.video });
    } catch {
      if (token === this.loadToken) this.listener?.onError(STREAM_ERROR_UNAVAILABLE);
      return;
    }
    if (token !== this.loadToken) return;
    await this.attachSource(media, resolved, options, startSeconds, token);
    if (token !== this.loadToken) return;
    if (autoplay) this.startPlayback(media);
    else this.listener?.onStateChange(YT_STATE.CUED);
  }

  prefetch(videoId: string): void {
    this.bridge.prefetch(videoId);
  }

  play(): void {
    this.wantsPlay = true;
    if (this.media) this.startPlayback(this.media);
  }

  pause(): void {
    this.wantsPlay = false;
    this.media?.pause();
  }

  stop(): void {
    this.wantsPlay = false;
    this.current = null;
    this.loadToken++;
    if (!this.media) return;
    this.reset(this.media);
    this.media.removeAttribute('poster');
    this.media.style.backgroundImage = '';
  }

  seekTo(seconds: number): void {
    if (this.media) this.media.currentTime = Math.max(0, seconds);
  }

  setVolume(volume: number): void {
    this.volume = volume;
    if (this.media) this.media.volume = volume / 100;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.media) this.media.muted = muted;
  }

  getCurrentTime(): number {
    return this.media?.currentTime ?? 0;
  }

  getDuration(): number {
    const duration = this.media?.duration ?? 0;
    return Number.isFinite(duration) ? duration : 0;
  }

  private ensureMedia(): HTMLVideoElement {
    if (this.media) return this.media;
    if (!this.host) throw new Error('Player host not attached');
    const media = document.createElement('video');
    media.className = 'player-viewport__media';
    media.playsInline = true;
    media.preload = 'auto';
    media.volume = this.volume / 100;
    media.muted = this.muted;
    media.setAttribute('aria-label', this.title);
    media.addEventListener('playing', () => this.listener?.onStateChange(YT_STATE.PLAYING));
    media.addEventListener('waiting', () => this.listener?.onStateChange(YT_STATE.BUFFERING));
    media.addEventListener('ended', () => this.listener?.onStateChange(YT_STATE.ENDED));
    media.addEventListener('pause', () => {
      if (!media.ended && !this.wantsPlay) this.listener?.onStateChange(YT_STATE.PAUSED);
    });
    media.addEventListener('error', () => {
      // With HLS, hls.js reports its own (fatal) errors; an empty src is not a failure.
      if (!this.hls && media.getAttribute('src') !== null) void this.handleFailure();
    });
    this.host.replaceChildren(media);
    this.media = media;
    return media;
  }

  private async attachSource(
    media: HTMLVideoElement,
    resolved: ResolvedMedia,
    options: LoadOptions,
    startSeconds: number,
    token: number,
  ): Promise<void> {
    const start = Math.max(0, startSeconds);
    if (options.video && resolved.hlsUrl) {
      const { default: Hls } = await import('hls.js');
      if (token !== this.loadToken) return;
      if (Hls.isSupported()) {
        const hls = new Hls({ startPosition: start > 0 ? start : -1 });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) void this.handleFailure();
        });
        hls.loadSource(resolved.hlsUrl);
        hls.attachMedia(media);
        this.hls = hls;
        return;
      }
    }
    // Audio only (music, or video without an HLS manifest): the thumbnail stays visible.
    media.src = resolved.audioSrc;
    if (start > 0) {
      media.addEventListener('loadedmetadata', () => (media.currentTime = start), { once: true });
    }
  }

  private startPlayback(media: HTMLVideoElement): void {
    media.play().catch(() => {
      // Rejected (e.g. interrupted by a new load): the next load or click starts it again.
    });
  }

  /** Stream failed: re-resolve once (URLs expire), then report the video as unplayable. */
  private async handleFailure(): Promise<void> {
    const current = this.current;
    const media = this.media;
    if (!current || !media) return;
    if (this.retried) {
      this.listener?.onError(STREAM_ERROR_UNAVAILABLE);
      return;
    }
    this.retried = true;
    const token = this.loadToken;
    const position = media.currentTime || 0;
    try {
      const resolved = await this.bridge.resolve(current.videoId, {
        video: current.options.video,
        refresh: true,
      });
      if (token !== this.loadToken) return;
      this.reset(media);
      await this.attachSource(media, resolved, current.options, position, token);
      if (token === this.loadToken && this.wantsPlay) this.startPlayback(media);
    } catch {
      if (token === this.loadToken) this.listener?.onError(STREAM_ERROR_UNAVAILABLE);
    }
  }

  private reset(media: HTMLVideoElement): void {
    this.hls?.destroy();
    this.hls = null;
    if (media.getAttribute('src') !== null) {
      media.removeAttribute('src');
      media.load();
    }
  }
}
