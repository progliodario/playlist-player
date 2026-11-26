import type { CSSProperties } from 'react';
import { playPlaylistByKey } from '../../app/actions.ts';
import { routeHref } from '../../app/router.ts';
import type { PlaylistSummary } from '../../domain/types.ts';
import { useStrings } from '../../i18n/index.ts';
import { usePlayerStore } from '../../player/player-store.ts';
import { useEffectiveKind } from '../../state/library-store.ts';
import { hueFromString } from '../art/art-math.ts';
import { EqualizerBars } from '../art/EqualizerBars.tsx';
import { Vinyl } from '../art/Vinyl.tsx';
import { joinMeta, playlistTitle } from '../display.ts';
import { Icon } from '../icons.tsx';
import { Thumbnail } from './Thumbnail.tsx';

/**
 * One playlist in the library grid. Rendered inside a <ul class="playlist-grid">.
 *
 * Accessibility: the title is the only link (its ::after covers the whole card, so the
 * card is clickable), which keeps the link name short; the play button is separate and
 * named "Riproduci <titolo>". Artwork is decorative.
 * Art: music playlists look like a record sleeve with the vinyl peeking out; videos look
 * like a film frame. Each card gets its own hue from its key.
 */
export function PlaylistCard({ playlist }: { playlist: PlaylistSummary }) {
  const t = useStrings();
  const kind = useEffectiveKind(playlist);
  const isCurrent = usePlayerStore((s) => s.queue?.sourceKey === playlist.key);
  const isPlaying = usePlayerStore((s) => s.playIntent && s.queue?.sourceKey === playlist.key);
  const title = playlistTitle(playlist, t);
  const hue = hueFromString(playlist.key);

  return (
    <li
      className={`playlist-card playlist-card--${kind} ${isCurrent ? 'is-current' : ''}`}
      style={{ '--hue': hue } as CSSProperties}
    >
      <div className="playlist-card__art">
        {kind === 'music' && (
          <Vinyl hue={hue} spinning={isPlaying} className="playlist-card__vinyl" />
        )}
        <Thumbnail
          src={playlist.thumbnailUrl}
          kind={kind}
          shape="square"
          className="playlist-card__cover"
        />
        {isCurrent && (
          <span className="playlist-card__badge">
            <EqualizerBars active={isPlaying} />
            {t.playlist.nowPlaying}
          </span>
        )}
        <button
          type="button"
          className="playlist-card__play"
          aria-label={t.playlist.playNamed(title)}
          onClick={() => void playPlaylistByKey(playlist.key)}
        >
          <Icon name="play" size={22} />
        </button>
      </div>
      <h3 className="playlist-card__title">
        <a
          className="playlist-card__link"
          href={routeHref({ name: 'playlist', key: playlist.key })}
          title={title}
        >
          {title}
        </a>
      </h3>
      <p className="playlist-card__meta">
        {joinMeta(
          playlist.itemCount > 0 && t.library.itemCount(playlist.itemCount, kind),
          kind === 'music' ? t.library.filterMusic : t.library.filterVideo,
        )}
      </p>
    </li>
  );
}
