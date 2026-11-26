import { useId } from 'react';
import { currentTrackIndex, upcomingTrackIndices } from '../../domain/queue.ts';
import { useStrings } from '../../i18n/index.ts';
import { usePlayerStore } from '../../player/player-store.ts';
import { useEffectiveKind, useSummary } from '../../state/library-store.ts';
import { TrackRow } from '../components/TrackRow.tsx';

/** Rendering many rows is cheap, but keep the panel snappy on old phones. */
const MAX_VISIBLE = 150;

/** "Up next" list: the current track first, then what follows. Clicking a row jumps there. */
export function QueueList() {
  const t = useStrings();
  const headingId = useId();
  const queue = usePlayerStore((s) => s.queue);
  const playing = usePlayerStore((s) => s.playIntent);
  const failed = usePlayerStore((s) => s.failedVideoIds);
  const jumpTo = usePlayerStore((s) => s.jumpTo);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const summary = useSummary(queue?.sourceKey);
  const kind = useEffectiveKind(summary);

  if (!queue) return null;
  const current = currentTrackIndex(queue);
  const upcoming = upcomingTrackIndices(queue);
  const visible = [current, ...upcoming].slice(0, MAX_VISIBLE);
  const hidden = upcoming.length + 1 - visible.length;

  return (
    <section className="queue" aria-labelledby={headingId}>
      <header className="queue__header">
        <h2 id={headingId} className="queue__title">
          {t.player.upNext}
        </h2>
        <button type="button" className="button button--ghost button--small" onClick={clearQueue}>
          {t.player.clearQueue}
        </button>
      </header>
      <ol className="track-list track-list--compact">
        {visible.map((trackIndex) => {
          const track = queue.tracks[trackIndex];
          if (!track) return null;
          return (
            <TrackRow
              key={`${trackIndex}-${track.videoId}`}
              track={track}
              kind={kind}
              isCurrent={trackIndex === current}
              isPlaying={playing}
              isUnplayable={failed.includes(track.videoId)}
              onPlay={() => jumpTo(trackIndex)}
            />
          );
        })}
      </ol>
      {hidden > 0 && <p className="queue__more">{t.player.moreInQueue(hidden)}</p>}
      {upcoming.length === 0 && <p className="queue__more">{t.player.queueEnd}</p>}
    </section>
  );
}
