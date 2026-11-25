/**
 * Root component: layout shell + routing.
 *
 * Layout (CSS grid, see src/styles/layout.css):
 *   desktop  [sidebar][main][now-playing panel]
 *   phone    [now-playing strip] / [main] / [bottom nav]
 * <NowPlayingPanel/> is rendered once and never unmounted (it hosts the YouTube iframe).
 */
import { useEffect, useRef } from 'react';
import { useStrings } from '../i18n/index.ts';
import { usePlayerStore } from '../player/player-store.ts';
import { Toasts } from '../ui/components/Toasts.tsx';
import { BottomNav, Sidebar } from '../ui/layout/Navigation.tsx';
import { NowPlayingPanel } from '../ui/player/NowPlayingPanel.tsx';
import { LibraryView } from '../ui/views/LibraryView.tsx';
import { NowPlayingView } from '../ui/views/NowPlayingView.tsx';
import { PlaylistView } from '../ui/views/PlaylistView.tsx';
import { SettingsView } from '../ui/views/SettingsView.tsx';
import {
  useDocumentTitleEffect,
  useKeyboardShortcuts,
  useLibraryLoader,
  useOnline,
  useThemeEffect,
} from './effects.ts';
import { useRoute, type Route } from './router.ts';

export function App() {
  const route = useRoute();
  const hasQueue = usePlayerStore((s) => s.queue !== null);
  const online = useOnline();
  const t = useStrings();
  const mainRef = useRef<HTMLElement>(null);

  useThemeEffect();
  useDocumentTitleEffect();
  useKeyboardShortcuts();
  useLibraryLoader();

  // Start each page at the top.
  const routeId = route.name === 'playlist' ? `playlist:${route.key}` : route.name;
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [routeId]);

  return (
    <div className={`app ${hasQueue ? 'app--has-queue' : ''}`}>
      <Sidebar route={route} />
      <main className="app__main" ref={mainRef}>
        {!online && <p className="offline-banner">{t.common.offline}</p>}
        <CurrentView route={route} />
      </main>
      <NowPlayingPanel />
      <BottomNav route={route} />
      <Toasts />
    </div>
  );
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
