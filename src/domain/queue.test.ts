import { describe, expect, it } from 'vitest';
import {
  createQueue,
  currentTrack,
  currentTrackIndex,
  cycleRepeat,
  jumpToTrack,
  next,
  previous,
  setShuffle,
  upcomingTrackIndices,
  type QueueState,
} from './queue.ts';
import type { Track } from './types.ts';

const tracks: Track[] = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
  videoId: id,
  title: id.toUpperCase(),
  channelTitle: 'ch',
  durationSeconds: 100,
}));

/** Deterministic pseudo-random generator for tests. */
function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function mustCreate(...args: Parameters<typeof createQueue>): QueueState {
  const q = createQueue(...args);
  if (!q) throw new Error('queue expected');
  return q;
}

describe('createQueue', () => {
  it('returns null for empty playlists', () => {
    expect(createQueue([])).toBeNull();
  });

  it('starts at the requested track in original order', () => {
    const q = mustCreate(tracks, { startIndex: 2 });
    expect(currentTrack(q)?.videoId).toBe('c');
    expect(upcomingTrackIndices(q)).toEqual([3, 4]);
  });

  it('clamps an out-of-range start index', () => {
    expect(currentTrackIndex(mustCreate(tracks, { startIndex: 99 }))).toBe(4);
  });

  it('shuffles keeping the start track first and every track exactly once', () => {
    const q = mustCreate(tracks, { startIndex: 3, shuffle: true, random: seeded() });
    expect(q.order[0]).toBe(3);
    expect([...q.order].sort()).toEqual([0, 1, 2, 3, 4]);
    expect(currentTrack(q)?.videoId).toBe('d');
  });
});

describe('next / previous', () => {
  it('stops at the end with repeat off', () => {
    const q = mustCreate(tracks, { startIndex: 4 });
    expect(next(q, 'ended')).toBeNull();
    expect(next(q, 'user')).toBeNull();
  });

  it('wraps at the end with repeat all', () => {
    const q = mustCreate(tracks, { startIndex: 4, repeat: 'all' });
    expect(currentTrack(next(q, 'ended') as QueueState)?.videoId).toBe('a');
  });

  it('repeats the same track when it ends with repeat one, but not on user next', () => {
    const q = mustCreate(tracks, { startIndex: 1, repeat: 'one' });
    expect(currentTrack(next(q, 'ended') as QueueState)?.videoId).toBe('b');
    expect(currentTrack(next(q, 'user') as QueueState)?.videoId).toBe('c');
  });

  it('goes back and wraps only with repeat all', () => {
    const q = mustCreate(tracks, { startIndex: 0 });
    expect(currentTrack(previous(q))?.videoId).toBe('a');
    expect(currentTrack(previous({ ...q, repeat: 'all' }))?.videoId).toBe('e');
    expect(currentTrack(previous(mustCreate(tracks, { startIndex: 2 })))?.videoId).toBe('b');
  });
});

describe('shuffle toggling', () => {
  it('keeps the current track when turning shuffle on and off', () => {
    const q = mustCreate(tracks, { startIndex: 2 });
    const shuffled = setShuffle(q, true, seeded(7));
    expect(currentTrack(shuffled)?.videoId).toBe('c');
    expect(shuffled.position).toBe(0);

    const moved = next(shuffled, 'user') as QueueState;
    const playing = currentTrack(moved)?.videoId;
    const unshuffled = setShuffle(moved, false);
    expect(currentTrack(unshuffled)?.videoId).toBe(playing);
    expect(unshuffled.order).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('jumpToTrack and cycleRepeat', () => {
  it('jumps to a track by original index', () => {
    const q = mustCreate(tracks, { shuffle: true, random: seeded(3) });
    expect(currentTrack(jumpToTrack(q, 4))?.videoId).toBe('e');
  });

  it('cycles off -> all -> one -> off', () => {
    const q = mustCreate(tracks);
    const all = cycleRepeat(q);
    const one = cycleRepeat(all);
    expect([all.repeat, one.repeat, cycleRepeat(one).repeat]).toEqual(['all', 'one', 'off']);
  });
});
