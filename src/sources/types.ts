/**
 * Contract every playlist source implements. To add a new source:
 *  1. add its name to SourceKind in src/domain/types.ts
 *  2. implement this interface in src/sources/<name>/<name>-source.ts
 *  3. register it in src/sources/registry.ts
 *  4. add its section title to src/i18n/*.ts
 * See docs/DATA-SOURCES.md.
 */
import type { Playlist, PlaylistSummary, SourceKind } from '../domain/types.ts';

export interface PlaylistSource {
  readonly kind: SourceKind;
  /** False when the source cannot be used right now (e.g. not signed in). */
  isAvailable(): boolean;
  listPlaylists(): Promise<PlaylistSummary[]>;
  getPlaylist(id: string): Promise<Playlist>;
}

/** Thrown when a source is used while unavailable. */
export class SourceUnavailableError extends Error {
  constructor(message = 'Source unavailable') {
    super(message);
    this.name = 'SourceUnavailableError';
  }
}
