/**
 * A vinyl record. The label takes the playlist hue; it spins while music plays
 * (animation disabled for users who prefer reduced motion). Decorative only.
 */
import type { CSSProperties } from 'react';

const GROOVES = [94, 89, 84, 79, 74, 69, 64, 59, 54, 49, 44];

export function Vinyl({
  hue,
  spinning = false,
  className = '',
}: {
  hue: number;
  spinning?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`vinyl ${spinning ? 'is-spinning' : ''} ${className}`}
      viewBox="0 0 200 200"
      style={{ '--hue': hue } as CSSProperties}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="100" cy="100" r="99" className="vinyl__disc" />
      {GROOVES.map((r, i) => (
        <circle
          key={r}
          cx="100"
          cy="100"
          r={r}
          className={`vinyl__groove ${i % 3 === 0 ? 'is-deep' : ''}`}
        />
      ))}
      <path className="vinyl__sheen" d="M100 100 L170 30 A99 99 0 0 1 190 70 Z" />
      <path className="vinyl__sheen" d="M100 100 L30 170 A99 99 0 0 1 10 130 Z" />
      <circle cx="100" cy="100" r="36" className="vinyl__label" />
      <circle cx="100" cy="100" r="30" className="vinyl__label-ring" />
      <path className="vinyl__label-mark" d="M92 86 L114 100 L92 114 Z" />
      <circle cx="100" cy="100" r="3.2" className="vinyl__hole" />
    </svg>
  );
}
