/**
 * "catalog" source: public playlists of the configured channel, read from static JSON
 * files generated at deploy time by scripts/build-catalog.ts. Works without sign-in.
 */
import { BASE_URL } from '../../config/app-config.ts';
import { makePlaylistKey, type Playlist, type PlaylistSummary } from '../../domain/types.ts';
import { videoThumbnailUrl } from '../../domain/youtube-urls.ts';
import type { PlaylistSource } from '../types.ts';
import {
  CATALOG_SCHEMA_VERSION,
  type CatalogIndex,
  type CatalogPlaylistFile,
  type CatalogPlaylistSummary,
} from './catalog-schema.ts';

const CATALOG_URL = `${BASE_URL}catalog/`;

let indexPromise: Promise<CatalogIndex> | null = null;

/** Loads (once) and returns the catalog index. Exposed for the settings page. */
export function loadCatalogIndex(force = false): Promise<CatalogIndex> {
  if (!indexPromise || force) {
    indexPromise = fetchJson<CatalogIndex>(`${CATALOG_URL}index.json`).then((index) => {
      if (index.schemaVersion !== CATALOG_SCHEMA_VERSION) {
        throw new Error(`Unsupported catalog schema ${index.schemaVersion}`);
      }
      return index;
    });
    indexPromise.catch(() => {
      indexPromise = null; // allow retry after a failure
    });
  }
  return indexPromise;
}

export const catalogSource: PlaylistSource = {
  kind: 'catalog',

  isAvailable: () => true,

  async listPlaylists() {
    const index = await loadCatalogIndex(true);
    return index.playlists.map(toSummary);
  },

  async getPlaylist(id) {
    const [index, file] = await Promise.all([
      loadCatalogIndex(),
      fetchJson<CatalogPlaylistFile>(`${CATALOG_URL}playlists/${encodeURIComponent(id)}.json`),
    ]);
    const summary = index.playlists.find((p) => p.id === id);
    const base: PlaylistSummary = summary
      ? toSummary(summary)
      : toSummary({
          id,
          title: file.title,
          description: '',
          itemCount: file.tracks.length,
          thumbnailVideoId: file.tracks[0]?.videoId ?? null,
          detectedKind: 'video',
          updatedAt: null,
          totalDurationSeconds: null,
          ownerName: null,
        });
    const playlist: Playlist = { ...base, tracks: file.tracks };
    return playlist;
  },
};

function toSummary(p: CatalogPlaylistSummary): PlaylistSummary {
  return {
    key: makePlaylistKey('catalog', p.id),
    source: 'catalog',
    id: p.id,
    title: p.title,
    description: p.description,
    itemCount: p.itemCount,
    thumbnailUrl: p.thumbnailVideoId ? videoThumbnailUrl(p.thumbnailVideoId, 'hq') : null,
    detectedKind: p.detectedKind,
    ownerName: p.ownerName,
    updatedAt: p.updatedAt,
    totalDurationSeconds: p.totalDurationSeconds,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status} (${url})`);
  return (await response.json()) as T;
}
