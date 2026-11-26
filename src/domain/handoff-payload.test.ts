import { describe, expect, it } from 'vitest';
import {
  androidPlayerIntentUrl,
  buildHandoffPayload,
  MAX_HANDOFF_TRACKS,
  type HandoffOptions,
} from './handoff-payload.ts';
import { createQueue, type QueueState } from './queue.ts';
import type { Track } from './types.ts';

const track = (n: number): Track => ({
  videoId: `video${String(n).padStart(6, '0')}`,
  title: `Song ${n}`,
  channelTitle: `Artist ${n} - Topic`,
  durationSeconds: n === 2 ? null : 100 + n,
});
const tracks = (count: number) => Array.from({ length: count }, (_, i) => track(i));
const options: HandoffOptions = {
  kind: 'music',
  positionSeconds: 12.7,
  autoplay: true,
  artistOf: (t) => t.channelTitle.replace(/ - Topic$/, ''),
};

describe('buildHandoffPayload', () => {
  it('sends every track in playlist order with the start index', () => {
    const queue = createQueue(tracks(4), { startIndex: 2, sourceTitle: 'Mix' }) as QueueState;
    const payload = buildHandoffPayload(queue, options);
    expect(payload).toMatchObject({
      v: 1,
      title: 'Mix',
      kind: 'music',
      start: 2,
      position: 12,
      shuffle: false,
      order: null,
      repeat: 'off',
      autoplay: true,
    });
    expect(payload.tracks).toHaveLength(4);
    expect(payload.tracks[2]).toEqual(['video000002', 'Song 2', 'Artist 2', null]);
  });

  it('rotates the shuffled order so it starts with the current track', () => {
    const queue: QueueState = {
      ...(createQueue(tracks(5)) as QueueState),
      shuffle: true,
      order: [3, 0, 4, 1, 2],
      position: 2,
    };
    const payload = buildHandoffPayload(queue, options);
    expect(payload.start).toBe(4);
    expect(payload.order).toEqual([4, 1, 2, 3, 0]);
  });

  it('sends only the next tracks of very long queues, already in play order', () => {
    const queue: QueueState = { ...(createQueue(tracks(MAX_HANDOFF_TRACKS + 10)) as QueueState) };
    queue.position = 5;
    const payload = buildHandoffPayload(queue, options);
    expect(payload.tracks).toHaveLength(MAX_HANDOFF_TRACKS);
    expect(payload.start).toBe(0);
    expect(payload.tracks[0]?.[0]).toBe('video000005');
    expect(payload.shuffle).toBe(false);
  });
});

describe('androidPlayerIntentUrl', () => {
  it('targets only our package and encodes the payload', () => {
    const queue = createQueue(tracks(1), { sourceTitle: 'A; B #1' }) as QueueState;
    const url = androidPlayerIntentUrl(
      'io.example.app',
      'play',
      buildHandoffPayload(queue, options),
    );
    expect(
      url.startsWith(
        'intent://play/#Intent;scheme=playlistplayer;package=io.example.app;S.payload=',
      ),
    ).toBe(true);
    expect(url.endsWith(';end')).toBe(true);
    const encoded = url.slice(url.indexOf('S.payload=') + 10, -';end'.length);
    expect(encoded).not.toMatch(/[;#]/);
    expect(JSON.parse(decodeURIComponent(encoded)).title).toBe('A; B #1');
  });

  it('builds the "open" link without a payload', () => {
    expect(androidPlayerIntentUrl('io.example.app', 'open')).toBe(
      'intent://open/#Intent;scheme=playlistplayer;package=io.example.app;end',
    );
  });
});
