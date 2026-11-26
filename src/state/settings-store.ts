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
    }),
    {
      name: STORAGE_KEYS.settings,
      version: 1,
      storage: createJSONStorage(() => localStorage),
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
