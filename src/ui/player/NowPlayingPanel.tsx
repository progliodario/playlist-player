import { routeHref } from '../../app/router.ts';
import { videoUrl } from '../../domain/youtube-urls.ts';
import { useStrings } from '../../i18n/index.ts';
import { useCurrentTrack, usePlayerStore } from '../../player/player-store.ts';
import { useEffectiveKind, useSummary } from '../../state/library-store.ts';
import { playlistTitle, trackSubtitle } from '../display.ts';
import { Icon } from '../icons.tsx';
import { PlayerControls, VolumeControl } from './PlayerControls.tsx';
import { PlayerViewport } from './PlayerViewport.tsx';
import { ProgressBar } from './ProgressBar.tsx';
import { QueueList } from './QueueList.tsx';

/**
 * The player area. Rendered ONCE by <App/> and positioned by CSS:
 *  - desktop: right column with video, controls and queue;
 *  - phone: strip at the top (video + compact controls), hidden when the queue is empty.
 * Music playlists get a square, album-like player on phones (still >= 200x200 px).
 */
export function NowPlayingPanel() {
  const t = useStrings();
  const queue = usePlayerStore((s) => s.queue);
  const track = useCurrentTrack();
  const lastError = usePlayerStore((s) => s.lastError);
  const dismissError = usePlayerStore((s) => s.dismissError);
  const summary = useSummary(queue?.sourceKey);
  const kind = useEffectiveKind(summary);
  const sourceTitle = summary ? playlistTitle(summary, t) : (queue?.sourceTitle ?? null);

  return (
    <aside
      className={`now-playing now-playing--${kind} ${queue ? '' : 'is-empty'}`}
      aria-label={t.nav.nowPlaying}
    >
      <PlayerViewport />

      {!queue && (
        <div className="now-playing__empty">
          <Icon name="nowPlaying" size={36} />
          <p>{t.player.nothingPlaying}</p>
          <p className="muted">{t.player.pickSomething}</p>
        </div>
      )}

      {queue && track && (
        <>
          <div className="now-playing__info">
            <p className="now-playing__title" title={track.title}>
              {track.title || track.videoId}
            </p>
            <p className="now-playing__subtitle">{trackSubtitle(track)}</p>
            {sourceTitle && queue.sourceKey && (
              <a
                className="now-playing__source desktop-only"
                href={routeHref({ name: 'playlist', key: queue.sourceKey })}
              >
                {t.player.from(sourceTitle)}
              </a>
            )}
          </div>
          <div className="now-playing__progress">
            <ProgressBar />
          </div>
          <div className="now-playing__controls">
            <div className="phone-only">
              <PlayerControls compact />
            </div>
            <div className="desktop-only">
              <PlayerControls />
            </div>
          </div>
          <div className="now-playing__volume desktop-only">
            <VolumeControl />
          </div>
          {lastError && (
            <div className="now-playing__error" role="alert">
              <p>{lastError.gaveUp ? t.player.errorGaveUp : t.player.errorSkipping}</p>
              <div className="now-playing__error-actions">
                <a
                  className="button button--small"
                  href={videoUrl(lastError.videoId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="external" size={16} /> {t.player.openOnYouTube}
                </a>
                <button
                  type="button"
                  className="button button--ghost button--small"
                  onClick={dismissError}
                >
                  {t.common.close}
                </button>
              </div>
            </div>
          )}
          <div className="now-playing__queue desktop-only">
            <QueueList />
          </div>
        </>
      )}
    </aside>
  );
}
