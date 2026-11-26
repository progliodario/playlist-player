import { useState, type CSSProperties } from 'react';
import { formatDuration } from '../../domain/format.ts';
import { useStrings } from '../../i18n/index.ts';
import { usePlayerClock, usePlayerStore } from '../../player/player-store.ts';

/**
 * Seek bar. While the user drags we only update local state; the seek is sent to
 * YouTube when the drag ends (one request instead of dozens).
 * Keyboard: arrows move by 5 seconds, Page Up/Down by 10% (native range behaviour).
 * The time labels are hidden from screen readers: aria-valuetext already says them.
 */
export function ProgressBar() {
  const t = useStrings();
  const currentTime = usePlayerClock((s) => s.currentTime);
  const duration = usePlayerClock((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  const [dragValue, setDragValue] = useState<number | null>(null);

  const value = dragValue ?? currentTime;
  const max = Math.max(duration, 1);
  const commit = () => {
    if (dragValue !== null) seek(dragValue);
    setDragValue(null);
  };

  return (
    <div className="progress">
      <span className="progress__time" aria-hidden="true">
        {formatDuration(value)}
      </span>
      <input
        type="range"
        className="range"
        min={0}
        max={max}
        step={5}
        value={Math.min(value, max)}
        aria-label={t.player.seek}
        aria-valuetext={t.player.seekValue(formatDuration(value), formatDuration(duration))}
        style={{ '--fill': `${(Math.min(value, max) / max) * 100}%` } as CSSProperties}
        onChange={(event) => setDragValue(Number(event.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
      <span className="progress__time" aria-hidden="true">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
