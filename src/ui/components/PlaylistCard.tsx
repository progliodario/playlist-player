import { playPlaylistByKey } from '../../app/actions.ts';
import { routeHref } from '../../app/router.ts';
import type { PlaylistSummary } from '../../domain/types.ts';
import { useStrings } from '../../i18n/index.ts';
import { usePlayerStore } from '../../player/player-store.ts';
import { useEffectiveKind } from '../../state/library-store.ts';
import { joinMeta, playlistTitle } from '../display.ts';
import { Icon } from '../icons.tsx';
import { Thumbnail } from './Thumbnail.tsx';

export function PlaylistCard({ playlist }: { playlist: PlaylistSummary }) {
  const t = useStrings();
  const kind = useEffectiveKind(playlist);
  const isCurrent = usePlayerStore((s) => s.queue?.sourceKey === playlist.key);
  const title = playlistTitle(playlist, t);

  return (
    <article className={`playlist-card ${isCurrent ? 'is-current' : ''}`}>
      <a className="playlist-card__link" href={routeHref({ name: 'playlist', key: playlist.key })}>
        <Thumbnail
          src={playlist.thumbnailUrl}
          kind={kind}
          shape="square"
          className="playlist-card__cover"
        />
        <h3 className="playlist-card__title" title={title}>
          {title}
        </h3>
        <p className="playlist-card__meta">
          {joinMeta(
            playlist.itemCount > 0 && t.library.itemCount(playlist.itemCount, kind),
            kind === 'music' ? t.library.filterMusic : t.library.filterVideo,
          )}
        </p>
      </a>
      {/* Overlay sized like the cover; only the round button inside is clickable. */}
      <div className="playlist-card__overlay">
        <button
          type="button"
          className="playlist-card__play"
          aria-label={`${t.playlist.play}: ${title}`}
          onClick={() => void playPlaylistByKey(playlist.key)}
        >
          <Icon name="play" size={22} />
        </button>
      </div>
    </article>
  );
}
