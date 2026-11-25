import { describe, expect, it } from 'vitest';
import { classifyPlaylist, trackMusicScore } from './classify.ts';

const track = (title: string, channelTitle: string, durationSeconds: number | null) => ({
  title,
  channelTitle,
  durationSeconds,
});

describe('trackMusicScore', () => {
  it('gives full score to Topic and VEVO channels', () => {
    expect(trackMusicScore(track('scossa', 'sangiovanni - Topic', 182))).toBe(1);
    expect(trackMusicScore(track('Song', 'ArtistVEVO', 2000))).toBe(1);
  });

  it('gives full score to music-looking titles', () => {
    expect(trackMusicScore(track('Artist - Song (Official Video)', 'Artist', 240))).toBe(1);
    expect(trackMusicScore(track('Canzone (Video Ufficiale)', 'Artista', 200))).toBe(1);
    expect(trackMusicScore(track('Song ft. Someone', 'Artist', null))).toBe(1);
  });

  it('gives a partial score to song-length videos', () => {
    expect(trackMusicScore(track('scossa', 'sangiovanni', 182))).toBe(0.6);
  });

  it('gives zero to long or unknown-length regular videos', () => {
    expect(trackMusicScore(track('How to cook pasta', 'Chef', 1200))).toBe(0);
    expect(trackMusicScore(track('Vlog', 'Someone', null))).toBe(0);
  });
});

describe('classifyPlaylist', () => {
  it('classifies an artist playlist with song-length videos as music', () => {
    const tracks = [
      track('scossa', 'sangiovanni', 182),
      track('malibu', 'sangiovanni', 167),
      track('LA FINE DEL MONDO', 'MRRAINOFFICIAL', 162),
    ];
    expect(classifyPlaylist('sangiovanni', tracks)).toBe('music');
  });

  it('classifies long videos as video', () => {
    const tracks = [track('Tutorial 1', 'Teacher', 900), track('Tutorial 2', 'Teacher', 1300)];
    expect(classifyPlaylist('Corso', tracks)).toBe('video');
  });

  it('uses the playlist title when there are no tracks', () => {
    expect(classifyPlaylist('Music', [])).toBe('music');
    expect(classifyPlaylist('Ricette', [])).toBe('video');
  });

  it('lets a music-sounding title tip a borderline playlist', () => {
    const tracks = [track('A', 'X', 200), track('B', 'X', 1500)]; // average 0.3
    expect(classifyPlaylist('Random', tracks)).toBe('video');
    // 3 of 4 tracks have song length: average 0.45, below the threshold on its own...
    const mostlySongs = [
      track('A', 'X', 200),
      track('B', 'X', 210),
      track('C', 'X', 190),
      track('D', 'X', 1500),
    ];
    expect(classifyPlaylist('Random', mostlySongs)).toBe('video');
    // ...but 0.45 + 0.15 bonus = 0.60 with a music-sounding title.
    expect(classifyPlaylist('Hits 2024', mostlySongs)).toBe('music');
  });
});
