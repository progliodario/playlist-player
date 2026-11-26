/**
 * App-wide side effects, as hooks used once by <App/>:
 * theme, page language, window title, route focus, screen reader announcements,
 * keyboard shortcuts, online status, library loading and automatic catalog refresh.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { appConfig } from '../config/app-config.ts';
import { getStrings, resolveLanguage, useStrings } from '../i18n/index.ts';
import { useCurrentTrack, usePlayerStore } from '../player/player-store.ts';
import { useAuthStore } from '../sources/account/auth-store.ts';
import { announce } from '../state/announcer-store.ts';
import { useLibraryStore } from '../state/library-store.ts';
import { useSettingsStore } from '../state/settings-store.ts';
import { showToast } from '../state/toast-store.ts';
import { trackSubtitle } from '../ui/display.ts';
import { focusMainContent } from '../ui/a11y/SkipLink.tsx';

/** Browser UI color (address bar, task switcher) per theme. Keep in sync with tokens.css --bg. */
const THEME_COLORS = { dark: '#0d0a1f', light: '#fff7f0' } as const;
/** How often the open app checks whether a newer channel catalog was published. */
const CATALOG_POLL_MS = 5 * 60 * 1000;

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
        ?.setAttribute('content', THEME_COLORS[resolved]);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}

/** Keeps <html lang> in sync with the UI language (WCAG 3.1.1 Language of Page). */
export function useLanguageEffect(): void {
  const language = useSettingsStore((s) => s.language);
  useEffect(() => {
    document.documentElement.lang = resolveLanguage(language);
  }, [language]);
}

/**
 * Window title: "<page> · <app>", prefixed with the playing track
 * (WCAG 2.4.2 Page Titled).
 */
export function useDocumentTitleEffect(pageTitle: string): void {
  const track = useCurrentTrack();
  const playing = usePlayerStore((s) => s.playIntent);
  useEffect(() => {
    const base = pageTitle ? `${pageTitle} · ${appConfig.appName}` : appConfig.appName;
    document.title = track && playing ? `▶ ${track.title} · ${base}` : base;
  }, [track, playing, pageTitle]);
}

/**
 * After navigation, moves keyboard focus to the new page heading so screen reader and
 * keyboard users start from the top of the new content (not on the first render).
 */
export function useRouteFocus(routeId: string): void {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Wait one frame: the new view must be in the DOM.
    const frame = window.requestAnimationFrame(() => focusMainContent());
    return () => window.cancelAnimationFrame(frame);
  }, [routeId]);
}

/** Announces the new track to screen readers when it changes while playing. */
export function useTrackAnnouncements(): void {
  const t = useStrings();
  const track = useCurrentTrack();
  const playing = usePlayerStore((s) => s.playIntent);
  const lastAnnounced = useRef<string | null>(null);
  useEffect(() => {
    if (!track || !playing || lastAnnounced.current === track.videoId) return;
    lastAnnounced.current = track.videoId;
    announce(t.player.nowPlayingAnnouncement(track.title, trackSubtitle(track)));
  }, [track, playing, t]);
}

/**
 * Single-key shortcuts (ignored while typing in a field; can be turned off in Settings,
 * WCAG 2.1.4). The list shown to users lives in src/i18n (settings.shortcutList).
 */
export function useKeyboardShortcuts(): void {
  const enabled = useSettingsStore((s) => s.keyboardShortcuts);
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      ) {
        return;
      }
      if (target?.closest('button, a, [role="radio"], summary') && event.key === ' ') return;
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
  }, [enabled]);
}

/**
 * Loads every source at startup, reloads the account source when auth changes, and
 * keeps the channel catalog fresh: checks every 5 minutes while the app is visible,
 * and whenever the app comes back to the foreground or online.
 */
export function useLibraryLoader(): void {
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    useLibraryStore.getState().loadAllSources();
  }, []);

  useEffect(() => {
    void useLibraryStore.getState().loadSource('account');
  }, [authStatus]);

  useEffect(() => {
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      const changed = await useLibraryStore.getState().refreshCatalogIfChanged();
      if (changed) showToast(getStrings().library.catalogUpdated, 'success');
    };
    const timer = window.setInterval(() => void check(), CATALOG_POLL_MS);
    const onVisible = () => void check();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, []);
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
