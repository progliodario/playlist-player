/**
 * "manual" source: playlists the user added by pasting a link (any public or unlisted
 * playlist, also from other channels, also YouTube Music links).
 *
 * The list of added playlists lives in the settings store (localStorage).
 * Loading tracks:
 *  - signed in  -> YouTube Data API (full metadata, no size limit)
 *  - signed out -> temporary embedded player for the ids + oEmbed for titles
 */
import { classifyPlaylist } from '../../domain/classify.ts';
import {
  makePlaylistKey,
  totalDuration,
  type Playlist,
  type PlaylistSummary,
  type Track,
} from '../../domain/types.ts';
import { videoThumbnailUrl } from '../../domain/youtube-urls.ts';
import { useSettingsStore, type ManualPlaylistEntry } from '../../state/settings-store.ts';
import { safeStorage, STORAGE_KEYS } from '../../state/storage-keys.ts';
import { getValidAccessToken } from '../account/auth-store.ts';
import { fetchPlaylistInfo, fetchPlaylistTracks } from '../account/youtube-data-api.ts';
import type { PlaylistSource } from '../types.ts';
import { fetchPlaylistOEmbed, fetchVideoOEmbed } from './oembed.ts';
import { resolvePlaylistVideoIds } from './player-resolver.ts';

const OEMBED_CONCURRENCY = 6;
/** Max cached video titles kept in localStorage. */
const TITLE_CACHE_LIMIT = 3000;

export const manualSource: PlaylistSource = {
  kind: 'manual',

  isAvailable: () => true,

  listPlaylists() {
    return Promise.resolve(useSettingsStore.getState().manualPlaylists.map(toSummary));
  },

  async getPlaylist(id) {
    const entry = useSettingsStore.getState().manualPlaylists.find((p) => p.id === id);
    const token = getValidAccessToken();
    const tracks = token ? await fetchPlaylistTracks(token, id) : await loadTracksWithoutApi(id);
    if (tracks.length === 0) throw new Error('empty-or-private');

    const title = entry?.title ?? id;
    const detectedKind = classifyPlaylist(title, tracks);
    useSettingsStore.getState().updateManualPlaylist(id, {
      itemCount: tracks.length,
      thumbnailVideoId: tracks[0]?.videoId ?? null,
      detectedKind,
    });
    const summary = toSummary(
      entry ?? {
        id,
        title,
        ownerName: null,
        addedAt: new Date().toISOString(),
        itemCount: tracks.length,
        thumbnailVideoId: tracks[0]?.videoId ?? null,
        detectedKind,
      },
    );
    const playlist: Playlist = {
      ...summary,
      itemCount: tracks.length,
      detectedKind,
      thumbnailUrl: summary.thumbnailUrl ?? videoThumbnailUrl(tracks[0]?.videoId ?? '', 'hq'),
      totalDurationSeconds: totalDuration(tracks),
      tracks,
    };
    return playlist;
  },
};

/**
 * Looks up a playlist before adding it: returns its title and owner, or null when the
 * playlist is private / does not exist.
 */
export async function lookupPlaylist(
  id: string,
): Promise<{ title: string; ownerName: string | null } | null> {
  const token = getValidAccessToken();
  if (token) {
    const info = await fetchPlaylistInfo(token, id).catch(() => null);
    if (info) return { title: info.title, ownerName: info.ownerName };
  }
  const oembed = await fetchPlaylistOEmbed(id);
  return oembed ? { title: oembed.title || id, ownerName: oembed.authorName || null } : null;
}

function toSummary(entry: ManualPlaylistEntry): PlaylistSummary {
  return {
    key: makePlaylistKey('manual', entry.id),
    source: 'manual',
    id: entry.id,
    title: entry.title,
    description: '',
    itemCount: entry.itemCount ?? 0,
    thumbnailUrl: entry.thumbnailVideoId ? videoThumbnailUrl(entry.thumbnailVideoId, 'hq') : null,
    detectedKind: entry.detectedKind ?? classifyPlaylist(entry.title, []),
    ownerName: entry.ownerName,
    updatedAt: entry.addedAt,
    totalDurationSeconds: null,
  };
}

// --- signed-out loading ------------------------------------------------------------------

async function loadTracksWithoutApi(playlistId: string): Promise<Track[]> {
  const ids = await resolvePlaylistVideoIds(playlistId);
  const cache = readTitleCache();
  const tracks: Track[] = ids.map((videoId) => {
    const cached = cache[videoId];
    return {
      videoId,
      title: cached?.[0] ?? '',
      channelTitle: cached?.[1] ?? '',
      durationSeconds: null,
    };
  });

  const missing = tracks.filter((t) => !t.title);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: OEMBED_CONCURRENCY }, async () => {
      while (cursor < missing.length) {
        const track = missing[cursor++] as Track;
        const info = await fetchVideoOEmbed(track.videoId);
        track.title = info?.title || track.videoId;
        track.channelTitle = info?.authorName ?? '';
        if (info) cache[track.videoId] = [info.title, info.authorName];
      }
    }),
  );
  writeTitleCache(cache);
  return tracks;
}

type TitleCache = Record<string, [title: string, channel: string]>;

function readTitleCache(): TitleCache {
  try {
    return JSON.parse(safeStorage.get(STORAGE_KEYS.manualTitles) ?? '{}') as TitleCache;
  } catch {
    return {};
  }
}

function writeTitleCache(cache: TitleCache): void {
  const entries = Object.entries(cache);
  const trimmed = entries.length > TITLE_CACHE_LIMIT ? entries.slice(-TITLE_CACHE_LIMIT) : entries;
  safeStorage.set(STORAGE_KEYS.manualTitles, JSON.stringify(Object.fromEntries(trimmed)));
}
