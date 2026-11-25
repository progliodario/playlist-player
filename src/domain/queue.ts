/**
 * Play queue logic: order, shuffle, repeat, next/previous.
 *
 * Immutable and pure: every function returns a new QueueState and never touches the
 * player. The player store (src/player/player-store.ts) applies the result to YouTube.
 * Randomness is injected (`random` parameter) so tests are deterministic.
 */
import type { Track } from './types.ts';

export type RepeatMode = 'off' | 'all' | 'one';

export interface QueueState {
  /** Tracks in their original playlist order. Never reordered. */
  tracks: Track[];
  /** Play order: indices into `tracks`. Identity when not shuffled. */
  order: number[];
  /** Current index into `order`. */
  position: number;
  shuffle: boolean;
  repeat: RepeatMode;
  /** Key of the playlist the queue was created from (see makePlaylistKey), if any. */
  sourceKey: string | null;
  /** Title of that playlist, shown in the "now playing" panel. */
  sourceTitle: string | null;
}

export type RandomFn = () => number;

export interface CreateQueueOptions {
  startIndex?: number;
  shuffle?: boolean;
  repeat?: RepeatMode;
  sourceKey?: string | null;
  sourceTitle?: string | null;
  random?: RandomFn;
}

/** Returns null when there is nothing to play. */
export function createQueue(tracks: Track[], options: CreateQueueOptions = {}): QueueState | null {
  if (tracks.length === 0) return null;
  const {
    shuffle = false,
    repeat = 'off',
    sourceKey = null,
    sourceTitle = null,
    random = Math.random,
  } = options;
  // When shuffling without an explicit start, start from a random track.
  const requestedStart = options.startIndex ?? (shuffle ? Math.floor(random() * tracks.length) : 0);
  const startIndex = clamp(requestedStart, 0, tracks.length - 1);
  const order = shuffle
    ? shuffledOrderStartingWith(tracks.length, startIndex, random)
    : identity(tracks.length);
  return {
    tracks,
    order,
    position: shuffle ? 0 : startIndex,
    shuffle,
    repeat,
    sourceKey,
    sourceTitle,
  };
}

/** Index (into `tracks`) of the current track. */
export function currentTrackIndex(queue: QueueState): number {
  return queue.order[queue.position] ?? 0;
}

export function currentTrack(queue: QueueState): Track | null {
  return queue.tracks[currentTrackIndex(queue)] ?? null;
}

/** Tracks still to play after the current one, in play order (for the "up next" list). */
export function upcomingTrackIndices(queue: QueueState): number[] {
  return queue.order.slice(queue.position + 1);
}

/**
 * Moves forward.
 *  - reason "ended": the track finished by itself; honours repeat "one".
 *  - reason "user": the user pressed next; always moves to another track.
 * Returns null when playback should stop (end of queue, repeat off).
 */
export function next(queue: QueueState, reason: 'ended' | 'user'): QueueState | null {
  if (reason === 'ended' && queue.repeat === 'one') return { ...queue };
  const isLast = queue.position >= queue.order.length - 1;
  if (!isLast) return { ...queue, position: queue.position + 1 };
  if (queue.repeat === 'off') return null;
  return { ...queue, position: 0 };
}

/** Moves back one track. At the start it wraps only with repeat "all". */
export function previous(queue: QueueState): QueueState {
  if (queue.position > 0) return { ...queue, position: queue.position - 1 };
  if (queue.repeat === 'all') return { ...queue, position: queue.order.length - 1 };
  return { ...queue };
}

/** Plays a specific track (index into `tracks`) without changing the order. */
export function jumpToTrack(queue: QueueState, trackIndex: number): QueueState {
  const position = queue.order.indexOf(trackIndex);
  return position === -1 ? { ...queue } : { ...queue, position };
}

/** Turns shuffle on/off while keeping the current track playing. */
export function setShuffle(
  queue: QueueState,
  shuffle: boolean,
  random: RandomFn = Math.random,
): QueueState {
  if (shuffle === queue.shuffle) return { ...queue };
  const current = currentTrackIndex(queue);
  if (shuffle) {
    return {
      ...queue,
      shuffle,
      order: shuffledOrderStartingWith(queue.tracks.length, current, random),
      position: 0,
    };
  }
  return { ...queue, shuffle, order: identity(queue.tracks.length), position: current };
}

const REPEAT_CYCLE: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' };

/** off -> all -> one -> off */
export function nextRepeatMode(mode: RepeatMode): RepeatMode {
  return REPEAT_CYCLE[mode];
}

export function cycleRepeat(queue: QueueState): QueueState {
  return { ...queue, repeat: nextRepeatMode(queue.repeat) };
}

// --- helpers -------------------------------------------------------------------------

function identity(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}

/** Fisher–Yates shuffle of 0..length-1 with `first` moved to the front. */
function shuffledOrderStartingWith(length: number, first: number, random: RandomFn): number[] {
  const rest = identity(length).filter((i) => i !== first);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j] as number, rest[i] as number];
  }
  return [first, ...rest];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
