import { useId } from 'react';

/** Retro cassette tape illustration for empty states. Decorative only. */
export function CassetteArt({ className = '' }: { className?: string }) {
  const gradientId = `cassette-label-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className={`cassette ${className}`}
      viewBox="0 0 240 150"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--violet)' }} />
          <stop offset="0.5" style={{ stopColor: 'var(--accent)' }} />
          <stop offset="1" style={{ stopColor: 'var(--gold)' }} />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="228" height="138" rx="14" className="cassette__body" />
      <rect x="22" y="20" width="196" height="70" rx="8" fill={`url(#${gradientId})`} />
      <rect x="34" y="30" width="120" height="6" rx="3" className="cassette__line" />
      <rect x="34" y="42" width="84" height="6" rx="3" className="cassette__line" />
      <rect x="62" y="56" width="116" height="28" rx="14" className="cassette__window" />
      <g className="cassette__reel">
        <circle cx="84" cy="70" r="11" />
        <path d="M84 61 v18 M75 70 h18" />
      </g>
      <g className="cassette__reel">
        <circle cx="156" cy="70" r="11" />
        <path d="M156 61 v18 M147 70 h18" />
      </g>
      <path d="M58 144 L72 112 H168 L182 144" className="cassette__bottom" />
      <circle cx="96" cy="128" r="4" className="cassette__hole" />
      <circle cx="144" cy="128" r="4" className="cassette__hole" />
    </svg>
  );
}
