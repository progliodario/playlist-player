/**
 * Cross-cutting user actions that touch several stores. UI components call these
 * instead of orchestrating stores themselves.
 */
import { parsePlaylistId } from '../domain/youtube-urls.ts';
import { getStrings } from '../i18n/index.ts';
import { usePlayerStore } from '../player/player-store.ts';
import { useAuthStore } from '../sources/account/auth-store.ts';
import { lookupPlaylist } from '../sources/manual/manual-source.ts';
import { useLibraryStore } from '../state/library-store.ts';
import { useSettingsStore } from '../state/settings-store.ts';
import { safeStorage, STORAGE_KEYS } from '../state/storage-keys.ts';
import { showToast } from '../state/toast-store.ts';
import { makePlaylistKey } from '../domain/types.ts';

/** Loads a playlist (if needed) and starts playing it. */
export async function playPlaylistByKey(
  key: string,
  options: { startIndex?: number; shuffle?: boolean } = {},
): Promise<void> {
  const playlist = await useLibraryStore.getState().loadPlaylist(key);
  if (!playlist || playlist.tracks.length === 0) {
    showToast(getStrings().playlist.loadError, 'error');
    return;
  }
  usePlayerStore.getState().playPlaylist(playlist, options);
}

/**
 * Plays a track of a playlist. If that playlist is already the queue, jumps inside the
 * queue (keeping shuffle); otherwise starts a new queue at that track.
 */
export async function playTrackOfPlaylist(key: string, trackIndex: number): Promise<void> {
  const { queue, jumpTo } = usePlayerStore.getState();
  const playlist = useLibraryStore.getState().details[key]?.playlist;
  if (
    queue &&
    queue.sourceKey === key &&
    playlist &&
    queue.tracks.length === playlist.tracks.length
  ) {
    jumpTo(trackIndex);
    return;
  }
  await playPlaylistByKey(key, { startIndex: trackIndex });
}

export type AddPlaylistResult =
  { ok: true; key: string; title: string } | { ok: false; reason: 'invalid' | 'not-found' };

/** Validates a pasted link, checks the playlist exists and adds it to "manual". */
export async function addPlaylistFromLink(input: string): Promise<AddPlaylistResult> {
  const id = parsePlaylistId(input);
  if (!id) return { ok: false, reason: 'invalid' };

  // Already in the library? Just point to it.
  const { sources } = useLibraryStore.getState();
  for (const source of ['catalog', 'account', 'manual'] as const) {
    const existing = sources[source].playlists.find((p) => p.id === id);
    if (existing) return { ok: true, key: existing.key, title: existing.title };
  }

  const info = await lookupPlaylist(id);
  if (!info) return { ok: false, reason: 'not-found' };

  useSettingsStore.getState().addManualPlaylist({
    id,
    title: info.title,
    ownerName: info.ownerName,
    addedAt: new Date().toISOString(),
    itemCount: null,
    thumbnailVideoId: null,
    detectedKind: null,
  });
  await useLibraryStore.getState().loadSource('manual');
  return { ok: true, key: makePlaylistKey('manual', id), title: info.title };
}

export async function removeManualPlaylist(id: string): Promise<void> {
  useSettingsStore.getState().removeManualPlaylist(id);
  await useLibraryStore.getState().loadSource('manual');
}

export async function signInWithGoogle(): Promise<void> {
  await useAuthStore.getState().signIn();
  if (useAuthStore.getState().status === 'signed-in') {
    await Promise.all([
      useLibraryStore.getState().loadSource('account'),
      useLibraryStore.getState().loadSource('manual'),
    ]);
  }
}

export async function signOutOfGoogle(): Promise<void> {
  await useAuthStore.getState().signOut();
  await useLibraryStore.getState().loadSource('account');
}

/** Deletes every pp:* key in localStorage and reloads the app. */
export function clearLocalData(): void {
  for (const key of Object.values(STORAGE_KEYS)) safeStorage.remove(key);
  window.location.reload();
}
