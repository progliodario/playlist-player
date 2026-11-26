/**
 * Helpers to read and build YouTube URLs. Pure functions, no network.
 */

/** Prefixes of YouTube playlist ids we accept when the user pastes a bare id. */
const PLAYLIST_ID_PREFIXES = ['PL', 'OL', 'UU', 'FL', 'RD', 'LL', 'LM'];
const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{2,80}$/;
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts a playlist id from what the user pasted: a full URL (youtube.com,
 * m.youtube.com, music.youtube.com, youtu.be) with a `list` parameter, or a bare id.
 * Returns null when nothing usable is found.
 */
export function parsePlaylistId(input: string): string | null {
  const text = input.trim();
  if (!text) return null;

  const fromUrl = readListParam(text);
  if (fromUrl !== undefined) return fromUrl && PLAYLIST_ID_PATTERN.test(fromUrl) ? fromUrl : null;

  if (PLAYLIST_ID_PATTERN.test(text) && PLAYLIST_ID_PREFIXES.some((p) => text.startsWith(p))) {
    return text;
  }
  return null;
}

/** Returns the `list` param of a URL-like string, null if absent, undefined if not a URL. */
function readListParam(text: string): string | null | undefined {
  const looksLikeUrl = /^(https?:\/\/)?([\w-]+\.)*(youtube\.com|youtu\.be)\//i.test(text);
  if (!looksLikeUrl) return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return url.searchParams.get('list');
  } catch {
    return null;
  }
}

export function isValidVideoId(id: string): boolean {
  return VIDEO_ID_PATTERN.test(id);
}

export function videoUrl(videoId: string, playlistId?: string): string {
  const list = playlistId ? `&list=${encodeURIComponent(playlistId)}` : '';
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}${list}`;
}

/**
 * Same video in YouTube Music (opens the official app on Android). With a Premium
 * subscription the official app keeps playing with the screen off.
 * "LL" (liked videos) has no YouTube Music equivalent, so it is not passed on.
 */
export function youtubeMusicUrl(videoId: string, playlistId?: string): string {
  const list = playlistId && playlistId !== 'LL' ? `&list=${encodeURIComponent(playlistId)}` : '';
  return `https://music.youtube.com/watch?v=${encodeURIComponent(videoId)}${list}`;
}

export function playlistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
}

/**
 * Thumbnail image of a video. These URLs are stable and need no API key.
 *  - mq: 320x180, good for lists and cards
 *  - hq: 480x360 (letterboxed 4:3)
 */
export function videoThumbnailUrl(videoId: string, quality: 'mq' | 'hq' = 'mq'): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${quality}default.jpg`;
}
