import { memo } from 'react';
import { formatDuration } from '../../domain/format.ts';
import type { PlaylistKind, Track } from '../../domain/types.ts';
import { videoThumbnailUrl } from '../../domain/youtube-urls.ts';
import { trackSubtitle } from '../display.ts';
import { Icon } from '../icons.tsx';
import { Thumbnail } from './Thumbnail.tsx';

/** One row of a track list (playlist page and queue). */
export const TrackRow = memo(function TrackRow({
  track,
  index,
  kind,
  isCurrent,
  isPlaying,
  isUnplayable,
  unplayableLabel,
  onPlay,
}: {
  track: Track;
  /** Number shown on the left (1-based); omit to hide the column. */
  index?: number;
  kind: PlaylistKind;
  isCurrent: boolean;
  isPlaying: boolean;
  isUnplayable: boolean;
  unplayableLabel: string;
  onPlay: () => void;
}) {
  return (
    <li
      className={`track-row ${isCurrent ? 'is-current' : ''} ${isUnplayable ? 'is-unplayable' : ''}`}
    >
      <button type="button" className="track-row__button" onClick={onPlay}>
        {index !== undefined && (
          <span className="track-row__index" aria-hidden="true">
            {isCurrent && isPlaying ? (
              <span className="eq">
                <i />
                <i />
                <i />
              </span>
            ) : (
              index
            )}
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
                <Icon name="close" size={12} /> {unplayableLabel}
              </>
            ) : (
              trackSubtitle(track)
            )}
          </span>
        </span>
        <span className="track-row__duration">{formatDuration(track.durationSeconds)}</span>
      </button>
    </li>
  );
});
