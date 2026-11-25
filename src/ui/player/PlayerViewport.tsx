import { useEffect, useRef } from 'react';
import { videoThumbnailUrl } from '../../domain/youtube-urls.ts';
import { useStrings } from '../../i18n/index.ts';
import { useCurrentTrack, usePlayerStore } from '../../player/player-store.ts';
import { playerEngine } from '../../player/youtube-player-engine.ts';
import { Icon } from '../icons.tsx';

/**
 * Box that hosts the YouTube iframe.
 *
 * IMPORTANT: this component must be rendered exactly once and never unmounted
 * (moving or re-creating an iframe reloads the video). Layout changes are CSS-only.
 * YouTube policy: keep it visible and at least 200x200 px while playing.
 */
export function PlayerViewport() {
  const t = useStrings();
  const hostRef = useRef<HTMLDivElement>(null);
  const track = useCurrentTrack();
  const loadedVideoId = usePlayerStore((s) => s.loadedVideoId);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  useEffect(() => {
    if (hostRef.current) playerEngine.attach(hostRef.current);
  }, []);

  // After a reload the queue is restored but no video is loaded yet: show its thumbnail.
  const showPoster = track !== null && loadedVideoId === null;

  return (
    <div className="player-viewport">
      <div ref={hostRef} className="player-viewport__host" />
      {showPoster && (
        <button
          type="button"
          className="player-viewport__poster"
          onClick={togglePlay}
          aria-label={t.player.play}
          title={t.player.restoredHint}
        >
          <img src={videoThumbnailUrl(track.videoId, 'hq')} alt="" />
          <span className="player-viewport__poster-play">
            <Icon name="play" size={34} />
          </span>
        </button>
      )}
    </div>
  );
}

/** Puts the player box in full screen (the iframe has no controls of its own). */
export function requestPlayerFullscreen(): void {
  const element = document.querySelector('.player-viewport');
  void element?.requestFullscreen?.().catch(() => undefined);
}
