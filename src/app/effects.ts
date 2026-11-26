/**
 * App-wide side effects, as hooks used once by <App/>:
 * theme, document title, keyboard shortcuts, online status, library loading.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { appConfig } from '../config/app-config.ts';
import { usePlayerStore, useCurrentTrack } from '../player/player-store.ts';
import { useAuthStore } from '../sources/account/auth-store.ts';
import { useLibraryStore } from '../state/library-store.ts';
import { useSettingsStore } from '../state/settings-store.ts';

const DARK_THEME_COLOR = '#12101c';
const LIGHT_THEME_COLOR = '#f7f6fb';

/** Applies the theme setting as <html data-theme="dark|light">. */
export function useThemeEffect(): void {
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const resolved = theme === 'auto' ? (media.matches ? 'light' : 'dark') : theme;
      document.documentElement.dataset.theme = resolved;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', resolved === 'light' ? LIGHT_THEME_COLOR : DARK_THEME_COLOR);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}

/** Shows the playing track in the window/tab title. */
export function useDocumentTitleEffect(): void {
  const track = useCurrentTrack();
  const playing = usePlayerStore((s) => s.playIntent);
  useEffect(() => {
    document.title =
      track && playing ? `▶ ${track.title} · ${appConfig.appName}` : appConfig.appName;
  }, [track, playing]);
}

/**
 * Keyboard shortcuts (ignored while typing in a field):
 *   Space / K  play-pause      J / L  -10s / +10s      N / P  next / previous
 *   M  mute                    S  shuffle              R  repeat
 * Documented in README.md: keep both in sync.
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      ) {
        return;
      }
      if (target?.tagName === 'BUTTON' && event.key === ' ') return; // let buttons handle Space
      const player = usePlayerStore.getState();
      const actions: Record<string, () => void> = {
        ' ': player.togglePlay,
        k: player.togglePlay,
        j: () => player.seekBy(-10),
        l: () => player.seekBy(10),
        n: player.next,
        p: player.previous,
        m: player.toggleMute,
        s: player.toggleShuffle,
        r: player.cycleRepeat,
      };
      const action = actions[event.key.toLowerCase()];
      if (action && player.queue) {
        event.preventDefault();
        action();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

/** Loads every source at startup and the account/manual ones again when auth changes. */
export function useLibraryLoader(): void {
  const authStatus = useAuthStore((s) => s.status);
  useEffect(() => {
    useLibraryStore.getState().loadAllSources();
  }, []);
  useEffect(() => {
    void useLibraryStore.getState().loadSource('account');
  }, [authStatus]);
}

function subscribeOnline(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}
