/**
 * Heuristic that decides whether a playlist is "music" (songs) or "video".
 *
 * Used both in the browser and by scripts/build-catalog.ts, so keep it pure.
 * The result is only a default: users can override it per playlist in the UI,
 * and maintainers can force it in app.config.json -> youtube.kindOverrides.
 *
 * How it works: every track gets a "music score" between 0 and 1, the playlist is
 * music when the average score (plus a small bonus for music-sounding playlist
 * titles) reaches MUSIC_THRESHOLD. Tune the constants below and run `npm test`.
 */
import type { PlaylistKind, Track } from './types.ts';

type ClassifiableTrack = Pick<Track, 'title' | 'channelTitle' | 'durationSeconds'>;

/** Auto-generated YouTube Music channels ("Artist - Topic") and VEVO channels. */
const MUSIC_CHANNEL = /(\s-\sTopic|VEVO)$/i;

/** Typical words in music video titles (Italian and English). */
const MUSIC_TITLE =
  /(official\s+(music\s+)?video|official\s+audio|official\s+visualizer|video\s+ufficiale|audio\s+ufficiale|lyric(s)?\s+video|\blyrics?\b|\bvisualizer\b|\bvideoclip\b|\btesto\b|\bfeat\.|\bft\.|\bprod\.)/i;

/** Playlist titles that strongly suggest music. */
const MUSIC_PLAYLIST_TITLE = /\b(music|musica|songs?|canzoni|brani|hits?|album|mix)\b/i;

/** A duration in this range (seconds) looks like a song. */
export const SONG_MIN_SECONDS = 60;
export const SONG_MAX_SECONDS = 8 * 60;

/** Score for a track that only "looks like a song" because of its length. */
const LENGTH_ONLY_SCORE = 0.6;
/** Bonus added to the average when the playlist title sounds like music. */
const TITLE_BONUS = 0.15;
/** Average score needed to call a playlist "music". */
export const MUSIC_THRESHOLD = 0.55;

export function trackMusicScore(track: ClassifiableTrack): number {
  if (MUSIC_CHANNEL.test(track.channelTitle) || MUSIC_TITLE.test(track.title)) return 1;
  const duration = track.durationSeconds;
  if (duration !== null && duration >= SONG_MIN_SECONDS && duration <= SONG_MAX_SECONDS) {
    return LENGTH_ONLY_SCORE;
  }
  return 0;
}

export function classifyPlaylist(
  playlistTitle: string,
  tracks: readonly ClassifiableTrack[],
): PlaylistKind {
  const titleLooksMusical = MUSIC_PLAYLIST_TITLE.test(playlistTitle);
  if (tracks.length === 0) return titleLooksMusical ? 'music' : 'video';

  const average = tracks.reduce((sum, track) => sum + trackMusicScore(track), 0) / tracks.length;
  const score = average + (titleLooksMusical ? TITLE_BONUS : 0);
  return score >= MUSIC_THRESHOLD ? 'music' : 'video';
}
