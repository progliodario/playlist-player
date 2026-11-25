import type { CSSProperties } from 'react';
import { useStrings } from '../../i18n/index.ts';
import { usePlayerStore } from '../../player/player-store.ts';
import { Icon } from '../icons.tsx';
import { requestPlayerFullscreen } from './PlayerViewport.tsx';

/** Transport buttons. `compact` hides shuffle/repeat (used in the phone mini panel). */
export function PlayerControls({ compact = false }: { compact?: boolean }) {
  const t = useStrings();
  const status = usePlayerStore((s) => s.status);
  const shuffle = usePlayerStore((s) => s.queue?.shuffle ?? false);
  const repeat = usePlayerStore((s) => s.queue?.repeat ?? s.repeat);
  const { togglePlay, next, previous, toggleShuffle, cycleRepeat } = usePlayerStore.getState();

  const isPlaying = status === 'playing' || status === 'buffering' || status === 'loading';
  const repeatLabel =
    repeat === 'one'
      ? t.player.repeatOne
      : repeat === 'all'
        ? t.player.repeatAll
        : t.player.repeatOff;

  return (
    <div className={`controls ${compact ? 'controls--compact' : ''}`}>
      {!compact && (
        <button
          type="button"
          className={`icon-button ${shuffle ? 'is-active' : ''}`}
          aria-pressed={shuffle}
          aria-label={t.player.shuffle}
          title={`${t.player.shuffle} (S)`}
          onClick={toggleShuffle}
        >
          <Icon name="shuffle" />
        </button>
      )}
      <button
        type="button"
        className="icon-button"
        aria-label={t.player.previous}
        title={`${t.player.previous} (P)`}
        onClick={previous}
      >
        <Icon name="previous" />
      </button>
      <button
        type="button"
        className={`play-button ${status === 'buffering' || status === 'loading' ? 'is-loading' : ''}`}
        aria-label={isPlaying ? t.player.pause : t.player.play}
        title={`${isPlaying ? t.player.pause : t.player.play} (K)`}
        onClick={togglePlay}
      >
        <Icon name={isPlaying ? 'pause' : 'play'} size={compact ? 22 : 26} />
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label={t.player.next}
        title={`${t.player.next} (N)`}
        onClick={next}
      >
        <Icon name="next" />
      </button>
      {!compact && (
        <button
          type="button"
          className={`icon-button ${repeat !== 'off' ? 'is-active' : ''}`}
          aria-label={repeatLabel}
          title={`${repeatLabel} (R)`}
          onClick={cycleRepeat}
        >
          <Icon name={repeat === 'one' ? 'repeatOne' : 'repeat'} />
        </button>
      )}
    </div>
  );
}

export function VolumeControl() {
  const t = useStrings();
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const { setVolume, toggleMute } = usePlayerStore.getState();
  const shown = muted ? 0 : volume;
  return (
    <div className="volume">
      <button
        type="button"
        className="icon-button"
        aria-label={muted ? t.player.unmute : t.player.mute}
        title={`${muted ? t.player.unmute : t.player.mute} (M)`}
        onClick={toggleMute}
      >
        <Icon name={muted || volume === 0 ? 'muted' : 'volume'} />
      </button>
      <input
        type="range"
        className="range"
        min={0}
        max={100}
        step={1}
        value={shown}
        aria-label={t.player.volume}
        style={{ '--fill': `${shown}%` } as CSSProperties}
        onChange={(event) => setVolume(Number(event.target.value))}
      />
      <button
        type="button"
        className="icon-button"
        aria-label={t.player.fullscreen}
        title={t.player.fullscreen}
        onClick={requestPlayerFullscreen}
      >
        <Icon name="fullscreen" />
      </button>
    </div>
  );
}
