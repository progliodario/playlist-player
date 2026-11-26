import type { CSSProperties } from 'react';
import { routeHref } from '../../app/router.ts';
import { parsePlaylistKey } from '../../domain/types.ts';
import { videoUrl, youtubeMusicUrl } from '../../domain/youtube-urls.ts';
import { useStrings } from '../../i18n/index.ts';
import { playbackTarget } from '../../player/player-engine.ts';
import { useCurrentTrack, usePlayerStore } from '../../player/player-store.ts';
import { useEffectiveKind, useSummary } from '../../state/library-store.ts';
import { CassetteArt } from '../art/CassetteArt.tsx';
import { hueFromString } from '../art/art-math.ts';
import { EqualizerBars } from '../art/EqualizerBars.tsx';
import { Vinyl } from '../art/Vinyl.tsx';
import { ExternalLink } from '../components/ExternalLink.tsx';
import { playlistTitle, trackSubtitle } from '../display.ts';
import { Icon } from '../icons.tsx';
import { NativePlayerNotice } from './NativePlayerNotice.tsx';
import { PlayerControls, VolumeControl } from './PlayerControls.tsx';
import { PlayerViewport } from './PlayerViewport.tsx';
import { ProgressBar } from './ProgressBar.tsx';
import { QueueList } from './QueueList.tsx';

/**
 * The player area ("stage"). Rendered ONCE by <App/> and positioned by CSS:
 *  - desktop: right column with video, record, controls and queue;
 *  - phone: strip at the top (video + compact controls), hidden when the queue is empty.
 * Music playlists get a square, album-like player on phones (still >= 200x200 px).
 * The stage is tinted with the hue of the playing playlist (--hue).
 * `showQueue` is false on the "now playing" page, which shows the full queue itself.
 * Inside the Android app (ad-free mode) the native player plays: the panel only shows
 * what was sent to it and a button to open it.
 */
export function NowPlayingPanel({ showQueue = true }: { showQueue?: boolean }) {
  const t = useStrings();
  const queue = usePlayerStore((s) => s.queue);
  const playing = usePlayerStore((s) => s.playIntent);
  const track = useCurrentTrack();
  const lastError = usePlayerStore((s) => s.lastError);
  const dismissError = usePlayerStore((s) => s.dismissError);
  const summary = useSummary(queue?.sourceKey);
  const kind = useEffectiveKind(summary);
  const sourceTitle = summary ? playlistTitle(summary, t) : (queue?.sourceTitle ?? null);
  const hue = hueFromString(queue?.sourceKey ?? 'idle');
  const playlistId = queue?.sourceKey ? parsePlaylistKey(queue.sourceKey)?.id : undefined;
  const native = playbackTarget === 'android';

  return (
    <aside
      className={`now-playing now-playing--${kind} ${queue ? '' : 'is-empty'} ${playing ? 'is-playing' : ''} ${native ? 'now-playing--native' : ''}`}
      aria-label={t.player.region}
      style={{ '--hue': hue } as CSSProperties}
    >
      <div className="now-playing__stage-light" aria-hidden="true" />
      <PlayerViewport />

      {!queue && (
        <div className="now-playing__empty">
          <CassetteArt className="now-playing__cassette" />
          <p className="now-playing__empty-title">{t.player.nothingPlaying}</p>
          <p className="muted">{t.player.pickSomething}</p>
        </div>
      )}

      {queue && track && (
        <>
          <div className="now-playing__info">
            <Vinyl hue={hue} spinning={playing} className="now-playing__vinyl desktop-only" />
            <div className="now-playing__text">
              <p className="now-playing__eyebrow desktop-only">
                <EqualizerBars active={playing} bars={4} />
                {t.playlist.nowPlaying}
              </p>
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
          </div>
          {native && <NativePlayerNotice />}
          {!native && (
            <div className="now-playing__progress">
              <ProgressBar />
            </div>
          )}
          {!native && (
            <div className="now-playing__controls">
              <div className="phone-only">
                <PlayerControls compact />
              </div>
              <div className="desktop-only">
                <PlayerControls />
              </div>
            </div>
          )}
          {!native && (
            <div className="now-playing__volume desktop-only">
              <VolumeControl />
            </div>
          )}
          <div className="now-playing__links desktop-only">
            <ExternalLink className="chip-link" href={youtubeMusicUrl(track.videoId, playlistId)}>
              <Icon name="headphones" size={16} /> {t.player.openInYouTubeMusic}
            </ExternalLink>
          </div>
          {lastError && (
            <div className="now-playing__error" role="alert">
              <p>{lastError.gaveUp ? t.player.errorGaveUp : t.player.errorSkipping}</p>
              <div className="now-playing__error-actions">
                <ExternalLink className="button button--small" href={videoUrl(lastError.videoId)}>
                  <Icon name="external" size={16} /> {t.player.openOnYouTube}
                </ExternalLink>
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
          {showQueue && (
            <div className="now-playing__queue desktop-only">
              <QueueList />
            </div>
          )}
        </>
      )}
    </aside>
  );
}
