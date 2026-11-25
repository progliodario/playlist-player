/**
 * Loads the YouTube IFrame Player API once and exposes it as a promise.
 * Docs: https://developers.google.com/youtube/iframe_api_reference
 */
import { loadScript } from '../utils/load-script.ts';

const API_URL = 'https://www.youtube.com/iframe_api';

/** Numeric player states (YT.PlayerState), redeclared to avoid relying on globals. */
export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

/**
 * Player error codes (onError):
 *  2   invalid parameter          5   HTML5 player error
 *  100 video not found / private  101, 150  owner does not allow embedding
 *  153 missing HTTP referrer (player configuration error)
 */
export type YouTubeErrorCode = number;

let apiPromise: Promise<typeof YT> | null = null;

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function loadYouTubeIframeApi(): Promise<typeof YT> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<typeof YT>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    loadScript(API_URL).catch((error: unknown) => {
      apiPromise = null;
      reject(error instanceof Error ? error : new Error(String(error)));
    });
  });
  return apiPromise;
}

/** Common player parameters. `origin` is required for the JS API to talk to the iframe. */
export function basePlayerVars(): YT.PlayerVars {
  return {
    autoplay: 0,
    controls: 0,
    disablekb: 1,
    enablejsapi: 1,
    fs: 0,
    iv_load_policy: 3,
    playsinline: 1,
    rel: 0,
    origin: window.location.origin,
  };
}
