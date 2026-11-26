/** Animated equalizer bars ("something is playing"). Decorative only. */
export function EqualizerBars({
  active = true,
  bars = 3,
  className = '',
}: {
  active?: boolean;
  bars?: number;
  className?: string;
}) {
  return (
    <span className={`eq ${active ? 'is-active' : ''} ${className}`} aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}
