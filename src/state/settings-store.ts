/**
 * User preferences and user-owned data, persisted in localStorage.
 * Everything here belongs to the viewer's browser only (nothing is synced).
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appConfig } from '../config/app-config.ts';
import type { PlaylistKind } from '../domain/types.ts';
import { STORAGE_KEYS } from './storage-keys.ts';

export type LanguageSetting = 'auto' | 'it' | 'en';
export type ThemeSetting = 'auto' | 'dark' | 'light';
export type LibraryFilter = 'all' | 'music' | 'video';
export type LibrarySort = 'default' | 'title' | 'size' | 'recent';
/**
 * Player used inside the Android and Windows apps (browsers always use YouTube's):
 * "ad-free" = the app's own player (no ads, keeps playing in the background),
 * "youtube" = the official YouTube player (fallback if YouTube changes break the other).
 */
export type PlaybackMode = 'ad-free' | 'youtube';

/** A playlist the user added by link (source "manual"). */
export interface ManualPlaylistEntry {
  id: string;
  title: string;
  ownerName: string | null;
  addedAt: string;
  /** Filled after the playlist is opened the first time. */
  itemCount: number | null;
  thumbnailVideoId: string | null;
  detectedKind: PlaylistKind | null;
}

interface SettingsState {
  language: LanguageSetting;
  theme: ThemeSetting;
  /** Overrides app.config.json -> google.oauthClientId when not empty. */
  oauthClientIdOverride: string;
  /** User choice of music/video per playlist key (beats the detected kind). */
  kindOverrides: Record<string, PlaylistKind>;
  manualPlaylists: ManualPlaylistEntry[];
  libraryFilter: LibraryFilter;
  librarySort: LibrarySort;
  /** Single-key keyboard shortcuts (WCAG 2.1.4: users must be able to turn them off). */
  keyboardShortcuts: boolean;
  playbackMode: PlaybackMode;

  setLanguage(language: LanguageSetting): void;
  setTheme(theme: ThemeSetting): void;
  setOauthClientIdOverride(value: string): void;
  setKindOverride(playlistKey: string, kind: PlaylistKind | null): void;
  addManualPlaylist(entry: ManualPlaylistEntry): void;
  updateManualPlaylist(id: string, patch: Partial<ManualPlaylistEntry>): void;
  removeManualPlaylist(id: string): void;
  setLibraryFilter(filter: LibraryFilter): void;
  setLibrarySort(sort: LibrarySort): void;
  setKeyboardShortcuts(enabled: boolean): void;
  setPlaybackMode(mode: PlaybackMode): void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'auto',
      theme: 'auto',
      oauthClientIdOverride: '',
      kindOverrides: {},
      manualPlaylists: [],
      libraryFilter: 'all',
      librarySort: 'default',
      keyboardShortcuts: true,
      playbackMode: 'ad-free',

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setOauthClientIdOverride: (value) => set({ oauthClientIdOverride: value.trim() }),
      setKindOverride: (playlistKey, kind) =>
        set((state) => {
          const kindOverrides = { ...state.kindOverrides };
          if (kind) kindOverrides[playlistKey] = kind;
          else delete kindOverrides[playlistKey];
          return { kindOverrides };
        }),
      addManualPlaylist: (entry) =>
        set((state) => ({
          manualPlaylists: [entry, ...state.manualPlaylists.filter((p) => p.id !== entry.id)],
        })),
      updateManualPlaylist: (id, patch) =>
        set((state) => ({
          manualPlaylists: state.manualPlaylists.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeManualPlaylist: (id) =>
        set((state) => ({ manualPlaylists: state.manualPlaylists.filter((p) => p.id !== id) })),
      setLibraryFilter: (libraryFilter) => set({ libraryFilter }),
      setLibrarySort: (librarySort) => set({ librarySort }),
      setKeyboardShortcuts: (keyboardShortcuts) => set({ keyboardShortcuts }),
      setPlaybackMode: (playbackMode) => set({ playbackMode }),
    }),
    {
      name: STORAGE_KEYS.settings,
      // v2: added playbackMode (missing in v1 data, the default applies).
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => persisted as SettingsState,
    },
  ),
);

/** OAuth client id in effect (user override first, then app.config.json). Empty = disabled. */
export function getOAuthClientId(): string {
  return useSettingsStore.getState().oauthClientIdOverride || appConfig.google.oauthClientId;
}

export function useOAuthClientId(): string {
  return useSettingsStore((s) => s.oauthClientIdOverride) || appConfig.google.oauthClientId;
}
