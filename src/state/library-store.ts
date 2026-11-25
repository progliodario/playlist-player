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

  loadSource(kind: SourceKind): Promise<void>;
  loadAllSources(): void;
  /** Loads tracks of a playlist (cached unless `force`). Returns null on failure. */
  loadPlaylist(key: string, force?: boolean): Promise<Playlist | null>;
}

const emptySource: SourceState = { status: 'idle', playlists: [], error: null };

export const useLibraryStore = create<LibraryState>()((_set, get) => ({
  sources: { catalog: emptySource, account: emptySource, manual: emptySource },
  details: {},

  async loadSource(kind) {
    const source = SOURCES[kind];
    if (!source.isAvailable()) {
      setSource(kind, { status: 'unavailable', playlists: [], error: null });
      return;
    }
    setSource(kind, { ...get().sources[kind], status: 'loading', error: null });
    try {
      const playlists = await source.listPlaylists();
      setSource(kind, { status: 'ready', playlists, error: null });
    } catch (error) {
      setSource(kind, { status: 'error', playlists: [], error: errorMessage(error) });
    }
  },

  loadAllSources() {
    for (const kind of SOURCE_ORDER) void get().loadSource(kind);
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
