/**
 * Core domain types shared by the whole app (and by scripts/build-catalog.ts).
 *
 * Rules for this folder (src/domain/):
 *  - Pure TypeScript only: no React, no DOM, no fetch, no browser storage.
 *  - Only "erasable" syntax (no enums/namespaces) so Node can import these files directly.
 *  - Every non-trivial function has a unit test next to it (*.test.ts).
 */

/**
 * Where a playlist comes from. See docs/DATA-SOURCES.md.
 *  - catalog: public playlists of the configured channel, pre-generated at deploy time.
 *  - account: playlists read live from the signed-in Google account (YouTube Data API).
 *  - manual:  playlists the user added by pasting a link.
 */
export type SourceKind = 'catalog' | 'account' | 'manual';

/** Whether a playlist is mostly songs or mostly regular videos. Drives UI presentation. */
export type PlaylistKind = 'music' | 'video';

/** One playable item of a playlist. */
export interface Track {
  /** 11-character YouTube video id. */
  videoId: string;
  title: string;
  /** Uploader channel name as reported by YouTube, e.g. "Diodato - Topic". */
  channelTitle: string;
  /** Duration in seconds, or null when unknown. */
  durationSeconds: number | null;
}

/** What the library grid needs to show a playlist, without its tracks. */
export interface PlaylistSummary {
  /** Globally unique key `${source}:${id}`. Always build it with makePlaylistKey(). */
  key: string;
  source: SourceKind;
  /** YouTube playlist id (e.g. "PL..."), or "LL" for liked videos. */
  id: string;
  title: string;
  description: string;
  /** Number of tracks (may be approximate for sources that cannot count exactly). */
  itemCount: number;
  thumbnailUrl: string | null;
  /** Kind guessed from the content. The user can override it (see library store). */
  detectedKind: PlaylistKind;
  ownerName: string | null;
  /** ISO 8601 date of the last known change, or null. */
  updatedAt: string | null;
  /** Sum of the known track durations in seconds, or null when unknown. */
  totalDurationSeconds: number | null;
}

/** A playlist with its tracks loaded. */
export interface Playlist extends PlaylistSummary {
  tracks: Track[];
}

export function makePlaylistKey(source: SourceKind, id: string): string {
  return `${source}:${id}`;
}

/** Inverse of makePlaylistKey(). Returns null for malformed keys. */
export function parsePlaylistKey(key: string): { source: SourceKind; id: string } | null {
  const separator = key.indexOf(':');
  if (separator <= 0) return null;
  const source = key.slice(0, separator);
  const id = key.slice(separator + 1);
  if (!id) return null;
  if (source !== 'catalog' && source !== 'account' && source !== 'manual') return null;
  return { source, id };
}

/** Sum of known durations, or null when no track has a duration. */
export function totalDuration(tracks: readonly Pick<Track, 'durationSeconds'>[]): number | null {
  let total = 0;
  let known = false;
  for (const track of tracks) {
    if (track.durationSeconds !== null) {
      total += track.durationSeconds;
      known = true;
    }
  }
  return known ? total : null;
}
