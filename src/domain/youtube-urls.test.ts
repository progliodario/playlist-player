import { describe, expect, it } from 'vitest';
import {
  isValidVideoId,
  parsePlaylistId,
  playlistUrl,
  videoThumbnailUrl,
  youtubeMusicUrl,
} from './youtube-urls.ts';

describe('parsePlaylistId', () => {
  it.each([
    [
      'https://www.youtube.com/playlist?list=PLtbPTgwZUZB5bw0RgtNl14ahc2LtbtYto',
      'PLtbPTgwZUZB5bw0RgtNl14ahc2LtbtYto',
    ],
    ['https://youtube.com/playlist?list=PLTM-XG-H2IL4&si=abc', 'PLTM-XG-H2IL4'],
    ['https://www.youtube.com/watch?v=xkVYAVdXx1A&list=PLUcIWAVf3tWI&index=2', 'PLUcIWAVf3tWI'],
    ['https://music.youtube.com/playlist?list=OLAK5uy_abcdefghijk', 'OLAK5uy_abcdefghijk'],
    ['https://m.youtube.com/playlist?list=PLabc123', 'PLabc123'],
    ['youtube.com/playlist?list=PLabc123', 'PLabc123'],
    ['https://youtu.be/xkVYAVdXx1A?list=PLabc123', 'PLabc123'],
    ['  PLabc123  ', 'PLabc123'],
    ['LL', 'LL'],
  ])('reads %s', (input, expected) => {
    expect(parsePlaylistId(input)).toBe(expected);
  });

  it.each([
    [''],
    ['hello world'],
    ['https://www.youtube.com/watch?v=xkVYAVdXx1A'],
    ['https://example.com/playlist?list=PLabc123'],
    ['XYabc123'],
    ['https://www.youtube.com/playlist?list=<script>'],
  ])('rejects %s', (input) => {
    expect(parsePlaylistId(input)).toBeNull();
  });
});

describe('url builders', () => {
  it('builds playlist and thumbnail urls', () => {
    expect(playlistUrl('PLabc')).toBe('https://www.youtube.com/playlist?list=PLabc');
    expect(videoThumbnailUrl('xkVYAVdXx1A')).toBe(
      'https://i.ytimg.com/vi/xkVYAVdXx1A/mqdefault.jpg',
    );
  });

  it('builds YouTube Music links', () => {
    expect(youtubeMusicUrl('xkVYAVdXx1A', 'PLabc')).toBe(
      'https://music.youtube.com/watch?v=xkVYAVdXx1A&list=PLabc',
    );
    expect(youtubeMusicUrl('xkVYAVdXx1A', 'LL')).toBe(
      'https://music.youtube.com/watch?v=xkVYAVdXx1A',
    );
    expect(youtubeMusicUrl('xkVYAVdXx1A')).toBe('https://music.youtube.com/watch?v=xkVYAVdXx1A');
  });

  it('validates video ids', () => {
    expect(isValidVideoId('xkVYAVdXx1A')).toBe(true);
    expect(isValidVideoId('short')).toBe(false);
  });
});
