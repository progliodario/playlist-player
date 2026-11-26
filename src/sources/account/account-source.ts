/**
 * "account" source: playlists of the signed-in Google account, read live from the
 * YouTube Data API. Includes private/unlisted playlists and "Liked videos".
 *
 * Not available until the user signs in (Settings -> Google account), which in turn
 * requires an OAuth client id (docs/sviluppo/account-google.md).
 */
import { classifyPlaylist } from '../../domain/classify.ts';
import {
  makePlaylistKey,
  totalDuration,
  type Playlist,
  type PlaylistSummary,
} from '../../domain/types.ts';
import { SourceUnavailableError, type PlaylistSource } from '../types.ts';
import { getValidAccessToken, useAuthStore } from './auth-store.ts';
import {
  fetchMyPlaylists,
  fetchPlaylistInfo,
  fetchPlaylistItemCount,
  fetchPlaylistTracks,
  YouTubeApiError,
  type ApiPlaylistInfo,
} from './youtube-data-api.ts';

/** Marker used as title for the liked-videos playlist; the UI translates it. */
export const LIKED_VIDEOS_TITLE = '__liked__';

export const accountSource: PlaylistSource = {
  kind: 'account',

  isAvailable: () => useAuthStore.getState().status === 'signed-in',

  async listPlaylists() {
    const token = requireToken();
    const playlists = await handleAuthErrors(() => fetchMyPlaylists(token));
    const summaries = playlists.map((p) => toSummary(p));

    const likesId = useAuthStore.getState().profile?.likesPlaylistId;
    if (likesId) {
      const count = await fetchPlaylistItemCount(token, likesId).catch(() => 0);
      if (count > 0) {
        summaries.unshift(
          toSummary({
            id: likesId,
            title: LIKED_VIDEOS_TITLE,
            description: '',
            itemCount: count,
            thumbnailUrl: null,
            updatedAt: null,
            ownerName: useAuthStore.getState().profile?.name ?? null,
          }),
        );
      }
    }
    return summaries;
  },

  async getPlaylist(id) {
    const token = requireToken();
    return handleAuthErrors(async () => {
      const isLikes = id === useAuthStore.getState().profile?.likesPlaylistId;
      const [info, tracks] = await Promise.all([
        isLikes ? Promise.resolve(null) : fetchPlaylistInfo(token, id),
        fetchPlaylistTracks(token, id),
      ]);
      const base: ApiPlaylistInfo = info ?? {
        id,
        title: isLikes ? LIKED_VIDEOS_TITLE : id,
        description: '',
        itemCount: tracks.length,
        thumbnailUrl: null,
        updatedAt: null,
        ownerName: null,
      };
      const playlist: Playlist = {
        ...toSummary(base),
        itemCount: tracks.length,
        detectedKind: classifyPlaylist(base.title, tracks),
        totalDurationSeconds: totalDuration(tracks),
        tracks,
      };
      return playlist;
    });
  },
};

function toSummary(p: ApiPlaylistInfo): PlaylistSummary {
  return {
    key: makePlaylistKey('account', p.id),
    source: 'account',
    id: p.id,
    title: p.title,
    description: p.description,
    itemCount: p.itemCount,
    thumbnailUrl: p.thumbnailUrl,
    // Without tracks we can only guess from the title; refined when the playlist is opened.
    detectedKind: classifyPlaylist(p.title === LIKED_VIDEOS_TITLE ? '' : p.title, []),
    ownerName: p.ownerName,
    updatedAt: p.updatedAt,
    totalDurationSeconds: null,
  };
}

function requireToken(): string {
  const token = getValidAccessToken();
  if (!token) throw new SourceUnavailableError('Not signed in');
  return token;
}

async function handleAuthErrors<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (error instanceof YouTubeApiError && error.status === 401) {
      useAuthStore.getState().markExpired();
      throw new SourceUnavailableError('Session expired');
    }
    throw error;
  }
}
