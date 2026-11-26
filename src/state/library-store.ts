/**
 * In-memory library: playlist lists per source and loaded playlist details.
 * Not persisted (the service worker caches the network responses instead).
 */
import { create } from 'zustand';
import {
  parsePlaylistKey,
  type Playlist,
  type PlaylistKind,
  type PlaylistSummary,
  type SourceKind,
} from '../domain/types.ts';
import { catalogVersion, loadCatalogIndex } from '../sources/catalog/catalog-source.ts';
import { SOURCE_ORDER, SOURCES } from '../sources/registry.ts';
import { useSettingsStore } from './settings-store.ts';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unavailable';

export interface SourceState {
  status: LoadStatus;
  playlists: PlaylistSummary[];
  error: string | null;
}

export interface DetailState {
  status: LoadStatus;
  playlist: Playlist | null;
  error: string | null;
}

interface LibraryState {
  sources: Record<SourceKind, SourceState>;
  details: Record<string, DetailState>;
  /** Content hash (or date) of the channel catalog currently shown. */
  catalogVersion: string | null;
  /** When the catalog currently shown was generated (ISO), for the settings page. */
  catalogGeneratedAt: string | null;

  /** `silent`: keep showing the current list while reloading (no skeleton). */
  loadSource(kind: SourceKind, options?: { silent?: boolean }): Promise<void>;
  loadAllSources(): void;
  /**
   * Checks whether a newer channel catalog was published and, if so, refreshes the
   * library without flicker. Called periodically while the app is open (src/app/effects.ts).
   * Returns true when something changed.
   */
  refreshCatalogIfChanged(): Promise<boolean>;
  /** Loads tracks of a playlist (cached unless `force`). Returns null on failure. */
  loadPlaylist(key: string, force?: boolean): Promise<Playlist | null>;
}

const emptySource: SourceState = { status: 'idle', playlists: [], error: null };

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  sources: { catalog: emptySource, account: emptySource, manual: emptySource },
  details: {},
  catalogVersion: null,
  catalogGeneratedAt: null,

  async loadSource(kind, options = {}) {
    const source = SOURCES[kind];
    if (!source.isAvailable()) {
      setSource(kind, { status: 'unavailable', playlists: [], error: null });
      return;
    }
    if (!options.silent) {
      setSource(kind, { ...get().sources[kind], status: 'loading', error: null });
    }
    try {
      const playlists = await source.listPlaylists();
      setSource(kind, { status: 'ready', playlists, error: null });
      if (kind === 'catalog') {
        const index = await loadCatalogIndex();
        set({ catalogVersion: catalogVersion(index), catalogGeneratedAt: index.generatedAt });
      }
    } catch (error) {
      if (options.silent && get().sources[kind].status === 'ready') return; // keep what we have
      setSource(kind, { status: 'error', playlists: [], error: errorMessage(error) });
    }
  },

  loadAllSources() {
    for (const kind of SOURCE_ORDER) void get().loadSource(kind);
  },

  async refreshCatalogIfChanged() {
    let version: string;
    try {
      version = catalogVersion(await loadCatalogIndex(true));
    } catch {
      return false; // offline or site unreachable: try again later
    }
    if (version === get().catalogVersion) return false;
    // Tracks of catalog playlists may have changed: forget them, they reload on demand.
    set((s) => ({
      details: Object.fromEntries(
        Object.entries(s.details).filter(([key]) => !key.startsWith('catalog:')),
      ),
    }));
    await get().loadSource('catalog', { silent: true });
    return true;
  },

  loadPlaylist(key, force = false) {
    const cached = get().details[key];
    if (!force && cached?.status === 'ready' && cached.playlist) {
      return Promise.resolve(cached.playlist);
    }
    const pending = inFlight.get(key);
    if (pending && !force) return pending;

    const parsed = parsePlaylistKey(key);
    if (!parsed) {
      setDetail(key, { status: 'error', playlist: null, error: 'invalid-key' });
      return Promise.resolve(null);
    }
    setDetail(key, { status: 'loading', playlist: cached?.playlist ?? null, error: null });
    const request = SOURCES[parsed.source]
      .getPlaylist(parsed.id)
      .then((playlist) => {
        setDetail(key, { status: 'ready', playlist, error: null });
        refreshSummary(playlist);
        return playlist;
      })
      .catch((error: unknown) => {
        setDetail(key, { status: 'error', playlist: null, error: errorMessage(error) });
        return null;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, request);
    return request;
  },
}));

/** Requests in progress, so that concurrent callers share one network round trip. */
const inFlight = new Map<string, Promise<Playlist | null>>();

function setSource(kind: SourceKind, state: SourceState) {
  useLibraryStore.setState((s) => ({ sources: { ...s.sources, [kind]: state } }));
}

function setDetail(key: string, state: DetailState) {
  useLibraryStore.setState((s) => ({ details: { ...s.details, [key]: state } }));
}

/** Keeps the library card in sync with what we learned by opening the playlist. */
function refreshSummary(playlist: Playlist) {
  const source = useLibraryStore.getState().sources[playlist.source];
  if (source.status !== 'ready') return;
  const playlists = source.playlists.map((p) =>
    p.key === playlist.key
      ? {
          ...p,
          itemCount: playlist.itemCount,
          detectedKind: playlist.detectedKind,
          totalDurationSeconds: playlist.totalDurationSeconds,
          thumbnailUrl: p.thumbnailUrl ?? playlist.thumbnailUrl,
        }
      : p,
  );
  setSource(playlist.source, { ...source, playlists });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Music/video as the user sees it: their override first, then the detected kind. */
export function effectiveKind(
  playlist: Pick<PlaylistSummary, 'key' | 'detectedKind'>,
): PlaylistKind {
  return useSettingsStore.getState().kindOverrides[playlist.key] ?? playlist.detectedKind;
}

export function useEffectiveKind(
  playlist: Pick<PlaylistSummary, 'key' | 'detectedKind'> | null,
): PlaylistKind {
  const override = useSettingsStore((s) => (playlist ? s.kindOverrides[playlist.key] : undefined));
  return override ?? playlist?.detectedKind ?? 'video';
}

/** Reactive version of findSummary(): re-renders when the library changes. */
export function useSummary(key: string | null | undefined): PlaylistSummary | null {
  return useLibraryStore((s) => {
    const parsed = key ? parsePlaylistKey(key) : null;
    if (!parsed) return null;
    return s.sources[parsed.source].playlists.find((p) => p.key === key) ?? null;
  });
}

/** Finds a summary by key across all loaded sources. */
export function findSummary(key: string): PlaylistSummary | null {
  const parsed = parsePlaylistKey(key);
  if (!parsed) return null;
  return (
    useLibraryStore.getState().sources[parsed.source].playlists.find((p) => p.key === key) ?? null
  );
}
