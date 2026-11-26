/**
 * Root component: layout shell + routing.
 *
 * Layout (CSS grid, see src/styles/layout.css):
 *   desktop  [sidebar][main][now-playing panel]
 *   phone    [now-playing strip] / [main] / [bottom nav]
 * <NowPlayingPanel/> is rendered once and never unmounted (it hosts the YouTube iframe).
 *
 * Accessibility skeleton: skip link first, landmarks (nav, main, aside), one live
 * announcer, focus moved to the page heading after each navigation.
 */
import { useStrings, type Strings } from '../i18n/index.ts';
import { usePlayerStore } from '../player/player-store.ts';
import { useSummary } from '../state/library-store.ts';
import { LiveAnnouncer } from '../ui/a11y/LiveAnnouncer.tsx';
import { MAIN_CONTENT_ID, SkipLink } from '../ui/a11y/SkipLink.tsx';
import { Toasts } from '../ui/components/Toasts.tsx';
import { playlistTitle } from '../ui/display.ts';
import { BottomNav, Sidebar } from '../ui/layout/Navigation.tsx';
import { NowPlayingPanel } from '../ui/player/NowPlayingPanel.tsx';
import { LibraryView } from '../ui/views/LibraryView.tsx';
import { NowPlayingView } from '../ui/views/NowPlayingView.tsx';
import { PlaylistView } from '../ui/views/PlaylistView.tsx';
import { SettingsView } from '../ui/views/SettingsView.tsx';
import {
  useDocumentTitleEffect,
  useKeyboardShortcuts,
  useMediaSessionEffect,
  useLanguageEffect,
  useLibraryLoader,
  useOnline,
  useRouteFocus,
  useThemeEffect,
  useTrackAnnouncements,
} from './effects.ts';
import { useRoute, type Route } from './router.ts';

export function App() {
  const route = useRoute();
  const hasQueue = usePlayerStore((s) => s.queue !== null);
  const online = useOnline();
  const t = useStrings();
  const playlistSummary = useSummary(route.name === 'playlist' ? route.key : null);
  const routeId = route.name === 'playlist' ? `playlist:${route.key}` : route.name;
  const pageTitle =
    route.name === 'playlist' && playlistSummary
      ? playlistTitle(playlistSummary, t)
      : pageTitleOf(route, t);

  useThemeEffect();
  useLanguageEffect();
  useDocumentTitleEffect(pageTitle);
  useRouteFocus(routeId);
  useTrackAnnouncements();
  useKeyboardShortcuts();
  useMediaSessionEffect();
  useLibraryLoader();

  return (
    <div className={`app ${hasQueue ? 'app--has-queue' : ''}`}>
      <SkipLink />
      <div className="app__backdrop" aria-hidden="true" />
      <Sidebar route={route} />
      <main id={MAIN_CONTENT_ID} className="app__main" tabIndex={-1}>
        {!online && <p className="offline-banner">{t.common.offline}</p>}
        <CurrentView key={routeId} route={route} />
      </main>
      <NowPlayingPanel showQueue={route.name !== 'now'} />
      <BottomNav route={route} />
      <Toasts />
      <LiveAnnouncer />
    </div>
  );
}

function pageTitleOf(route: Route, t: Strings): string {
  switch (route.name) {
    case 'library':
      return t.library.title;
    case 'playlist':
      return '';
    case 'now':
      return t.nav.nowPlaying;
    case 'settings':
      return t.settings.title;
  }
}

function CurrentView({ route }: { route: Route }) {
  switch (route.name) {
    case 'library':
      return <LibraryView />;
    case 'playlist':
      return <PlaylistView playlistKey={route.key} />;
    case 'now':
      return <NowPlayingView />;
    case 'settings':
      return <SettingsView />;
  }
}
