import { useState } from 'react';
import type { PlaylistKind } from '../../domain/types.ts';
import { Icon } from '../icons.tsx';

/**
 * Image with a graceful placeholder. `shape` decides the crop:
 * square for music (album-art look), 16:9 for videos.
 */
export function Thumbnail({
  src,
  kind,
  className = '',
  shape,
}: {
  src: string | null;
  kind: PlaylistKind;
  className?: string;
  shape?: 'square' | 'wide';
}) {
  const [failed, setFailed] = useState(false);
  const resolvedShape = shape ?? (kind === 'music' ? 'square' : 'wide');
  // YouTube "hqdefault" images are 4:3 with black bars around 16:9 videos: zoom them
  // when cropped to a square so the bars disappear.
  const zoom = resolvedShape === 'square' && Boolean(src?.includes('/hqdefault.jpg'));
  return (
    <div className={`thumb thumb--${resolvedShape} ${zoom ? 'thumb--zoom' : ''} ${className}`}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <div className="thumb__placeholder">
          <Icon name={kind === 'music' ? 'music' : 'video'} size={28} />
        </div>
      )}
    </div>
  );
}
