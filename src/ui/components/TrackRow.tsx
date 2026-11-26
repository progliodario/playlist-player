import { memo } from 'react';
import { formatDuration } from '../../domain/format.ts';
import type { PlaylistKind, Track } from '../../domain/types.ts';
import { videoThumbnailUrl } from '../../domain/youtube-urls.ts';
import { useStrings } from '../../i18n/index.ts';
import { EqualizerBars } from '../art/EqualizerBars.tsx';
import { trackSubtitle } from '../display.ts';
import { Icon } from '../icons.tsx';
import { Thumbnail } from './Thumbnail.tsx';

/**
 * One row of a track list (playlist page and queue), inside an <ol class="track-list">.
 * The whole row is one button: its accessible name is title, artist and duration, the
 * list gives the position ("3 di 37"), aria-current marks the playing track.
 */
export const TrackRow = memo(function TrackRow({
  track,
  index,
  kind,
  isCurrent,
  isPlaying,
  isUnplayable,
  onPlay,
}: {
  track: Track;
  /** Number shown on the left (1-based); omit to hide the column. */
  index?: number;
  kind: PlaylistKind;
  isCurrent: boolean;
  isPlaying: boolean;
  isUnplayable: boolean;
  onPlay: () => void;
}) {
  const t = useStrings();
  return (
    <li
      className={`track-row ${isCurrent ? 'is-current' : ''} ${isUnplayable ? 'is-unplayable' : ''}`}
    >
      <button
        type="button"
        className="track-row__button"
        aria-current={isCurrent ? 'true' : undefined}
        onClick={onPlay}
      >
        {index !== undefined && (
          <span className="track-row__index" aria-hidden="true">
            {isCurrent ? <EqualizerBars active={isPlaying} /> : index}
          </span>
        )}
        <Thumbnail
          src={videoThumbnailUrl(track.videoId)}
          kind={kind}
          shape={kind === 'music' ? 'square' : 'wide'}
          className="track-row__thumb"
        />
        <span className="track-row__text">
          <span className="track-row__title">{track.title || track.videoId}</span>
          <span className="track-row__subtitle">
            {isUnplayable ? (
              <>
                <Icon name="close" size={12} /> {t.playlist.unplayable}
              </>
            ) : (
              trackSubtitle(track)
            )}
          </span>
        </span>
        {isCurrent && <span className="visually-hidden">, {t.playlist.nowPlaying}</span>}
        <span className="track-row__duration">{formatDuration(track.durationSeconds)}</span>
      </button>
    </li>
  );
});
