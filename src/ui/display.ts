/** Small presentation helpers shared by several components. */
import { artistFromChannel } from '../domain/format.ts';
import type { PlaylistSummary, Track } from '../domain/types.ts';
import type { Strings } from '../i18n/index.ts';
import { LIKED_VIDEOS_TITLE } from '../sources/account/account-source.ts';

/** Playlist title as shown to the user (translates special playlists). */
export function playlistTitle(playlist: Pick<PlaylistSummary, 'title'>, t: Strings): string {
  return playlist.title === LIKED_VIDEOS_TITLE ? t.library.likedVideos : playlist.title;
}

/** Second line under a track title: artist for music, channel for videos. */
export function trackSubtitle(track: Track): string {
  return artistFromChannel(track.channelTitle);
}

/** Joins non-empty parts with a middle dot. */
export function joinMeta(...parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(' · ');
}
