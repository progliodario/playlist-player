import type { CSSProperties } from 'react';
import { routeHref } from '../../app/router.ts';
import { parsePlaylistKey } from '../../domain/types.ts';
import { youtubeMusicUrl } from '../../domain/youtube-urls.ts';
import { useStrings } from '../../i18n/index.ts';
import { playbackTarget } from '../../player/player-engine.ts';
import { useCurrentTrack, usePlayerStore } from '../../player/player-store.ts';
import { hueFromString } from '../art/art-math.ts';
import { Vinyl } from '../art/Vinyl.tsx';
import { ExternalLink } from '../components/ExternalLink.tsx';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { trackSubtitle } from '../display.ts';
import { Icon } from '../icons.tsx';
import { NativePlayerNotice } from '../player/NativePlayerNotice.tsx';
import { PlayerControls, VolumeControl } from '../player/PlayerControls.tsx';
import { QueueList } from '../player/QueueList.tsx';

/**
 * "Now playing" page: big spinning record, full controls and the whole queue. Mostly
 * useful on phones, where the top player strip only has the essential buttons.
 */
export function NowPlayingView() {
  const t = useStrings();
  const queue = usePlayerStore((s) => s.queue);
  const playing = usePlayerStore((s) => s.playIntent);
  const track = useCurrentTrack();

  if (!queue || !track) {
    return (
      <div className="view">
        <h1 className="view__title" tabIndex={-1}>
          {t.nav.nowPlaying}
        </h1>
        <StatusMessage
          art
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

  const hue = hueFromString(queue.sourceKey ?? 'idle');
  const playlistId = queue.sourceKey ? parsePlaylistKey(queue.sourceKey)?.id : undefined;

  return (
    <div className="view now-playing-view" style={{ '--hue': hue } as CSSProperties}>
      <h1 className="view__title" tabIndex={-1}>
        {t.nav.nowPlaying}
      </h1>
      <div className="now-playing-view__stage">
        <Vinyl hue={hue} spinning={playing} className="now-playing-view__vinyl" />
        <div className="now-playing-view__text">
          <p className="now-playing-view__title">{track.title || track.videoId}</p>
          <p className="now-playing-view__subtitle">{trackSubtitle(track)}</p>
          {queue.sourceTitle && <p className="muted">{t.player.from(queue.sourceTitle)}</p>}
        </div>
      </div>
      <div className="now-playing-view__controls">
        {playbackTarget === 'android' ? (
          <NativePlayerNotice />
        ) : (
          <>
            <PlayerControls />
            <VolumeControl />
          </>
        )}
        <ExternalLink className="chip-link" href={youtubeMusicUrl(track.videoId, playlistId)}>
          <Icon name="headphones" size={16} /> {t.player.openInYouTubeMusic}
        </ExternalLink>
      </div>
      <QueueList />
    </div>
  );
}
