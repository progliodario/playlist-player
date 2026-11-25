/**
 * Format of the static catalog files published with the site:
 *
 *   <base>/catalog/index.json               -> CatalogIndex
 *   <base>/catalog/playlists/<playlistId>.json -> CatalogPlaylistFile
 *
 * Written by scripts/build-catalog.ts, read by ./catalog-source.ts.
 * If you change these types, bump CATALOG_SCHEMA_VERSION and update both sides.
 * Only erasable TypeScript here: Node imports this file directly.
 */
import type { PlaylistKind, Track } from '../../domain/types.ts';

export const CATALOG_SCHEMA_VERSION = 1;

export interface CatalogIndex {
  schemaVersion: number;
  /** ISO 8601 timestamp of generation. */
  generatedAt: string;
  channel: {
    id: string;
    handle: string;
    title: string;
    url: string;
  };
  playlists: CatalogPlaylistSummary[];
}

export interface CatalogPlaylistSummary {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  /** Video whose thumbnail represents the playlist (first playable track), or null. */
  thumbnailVideoId: string | null;
  detectedKind: PlaylistKind;
  /** ISO date (YYYY-MM-DD) of the last change reported by YouTube, or null. */
  updatedAt: string | null;
  totalDurationSeconds: number | null;
  ownerName: string | null;
}

export interface CatalogPlaylistFile {
  schemaVersion: number;
  id: string;
  title: string;
  tracks: Track[];
}
