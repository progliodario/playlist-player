import { routeHref } from '../../app/router.ts';
import { useStrings } from '../../i18n/index.ts';
import { usePlayerStore } from '../../player/player-store.ts';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { PlayerControls } from '../player/PlayerControls.tsx';
import { QueueList } from '../player/QueueList.tsx';

/**
 * "Now playing" page: full controls and the whole queue. Mostly useful on phones,
 * where the top player strip only has the essential buttons.
 */
export function NowPlayingView() {
  const t = useStrings();
  const hasQueue = usePlayerStore((s) => s.queue !== null);

  if (!hasQueue) {
    return (
      <div className="view">
        <h1 className="view__title">{t.nav.nowPlaying}</h1>
        <StatusMessage
          action={
            <a className="button button--primary" href={routeHref({ name: 'library' })}>
              {t.nav.library}
            </a>
          }
        >
          {t.player.pickSomething}
        </StatusMessage>
      </div>
    );
  }

  return (
    <div className="view now-playing-view">
      <h1 className="view__title">{t.nav.nowPlaying}</h1>
      <div className="now-playing-view__controls">
        <PlayerControls />
      </div>
      <QueueList />
    </div>
  );
}
