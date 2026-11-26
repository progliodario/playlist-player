/**
 * Queue hand-off to the Android app's native player.
 *
 * Inside the Android app the web page does not play anything itself: it opens the native
 * player with an `intent://` link that carries the whole queue as JSON. The Android side
 * parses it in android/app/src/main/java/io/github/progliodario/playlistplayer/player/
 * HandoffPayload.kt: keep both files in sync and bump HANDOFF_VERSION on breaking changes.
 */
import { currentTrackIndex, type QueueState, type RepeatMode } from './queue.ts';
import type { PlaylistKind, Track } from './types.ts';

export const HANDOFF_VERSION = 1;
/** Above this many tracks only the next ones (in play order) are handed off. */
export const MAX_HANDOFF_TRACKS = 2000;
/** URL scheme registered by the native player activity (AndroidManifest.xml). */
export const ANDROID_PLAYER_SCHEME = 'playlistplayer';

/** One track: [videoId, title, artist, durationSeconds or null]. Arrays keep the URL short. */
export type HandoffTrack = [string, string, string, number | null];

export interface HandoffPayload {
  v: typeof HANDOFF_VERSION;
  /** Title of the playlist, shown by the native player. */
  title: string | null;
  kind: PlaylistKind;
  /** Index into `tracks` of the track to start with. */
  start: number;
  /** Start position in seconds. */
  position: number;
  shuffle: boolean;
  /** Play order (indices into `tracks`, first = start) when shuffled, otherwise null. */
  order: number[] | null;
  repeat: RepeatMode;
  autoplay: boolean;
  tracks: HandoffTrack[];
}

export interface HandoffOptions {
  kind: PlaylistKind;
  positionSeconds: number;
  autoplay: boolean;
  /** Artist line for a track (e.g. channel name without " - Topic"). */
  artistOf: (track: Track) => string;
}

export function buildHandoffPayload(queue: QueueState, options: HandoffOptions): HandoffPayload {
  const toTuple = (track: Track): HandoffTrack => [
    track.videoId,
    track.title,
    options.artistOf(track),
    track.durationSeconds,
  ];
  const base = {
    v: HANDOFF_VERSION,
    title: queue.sourceTitle,
    kind: options.kind,
    position: Math.max(0, Math.floor(options.positionSeconds)),
    repeat: queue.repeat,
    autoplay: options.autoplay,
  } as const;

  if (queue.tracks.length > MAX_HANDOFF_TRACKS) {
    // Very long queues: send the next tracks already in play order.
    const upcoming = queue.order
      .slice(queue.position, queue.position + MAX_HANDOFF_TRACKS)
      .map((index) => queue.tracks[index])
      .filter((track): track is Track => track !== undefined);
    return { ...base, start: 0, shuffle: false, order: null, tracks: upcoming.map(toTuple) };
  }

  const start = currentTrackIndex(queue);
  // Rotate the play order so it begins with the current track; tracks already played go
  // last (they come back with "repeat all", exactly as in the web player).
  const order = queue.shuffle
    ? [...queue.order.slice(queue.position), ...queue.order.slice(0, queue.position)]
    : null;
  return { ...base, start, shuffle: queue.shuffle, order, tracks: queue.tracks.map(toTuple) };
}

/**
 * `intent://` URL that opens the native player. Chrome turns it into an Android intent
 * for our package only (never another app). `play` replaces the queue; `open` just shows
 * the player as it is.
 */
export function androidPlayerIntentUrl(
  applicationId: string,
  action: 'play' | 'open',
  payload?: HandoffPayload,
): string {
  const extras = payload ? `S.payload=${encodeURIComponent(JSON.stringify(payload))};` : '';
  return `intent://${action}/#Intent;scheme=${ANDROID_PLAYER_SCHEME};package=${applicationId};${extras}end`;
}
