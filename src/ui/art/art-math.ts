/**
 * Small deterministic helpers for the decorative artwork in src/ui/art/.
 * Deterministic = the same input always draws the same picture (no flicker between
 * renders, stable screenshots, stable tests).
 */

/** Stable hue (0-359) for a string: gives every playlist its own accent color. */
export function hueFromString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}

/** Seeded pseudo-random generator (mulberry32). Returns numbers in [0, 1). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** SVG path through the given points, smoothed with quadratic curves. */
export function smoothPath(points: readonly [number, number][]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  let d = `M${round(first![0])} ${round(first![1])}`;
  for (let i = 0; i < rest.length; i++) {
    const [x, y] = rest[i]!;
    const next = rest[i + 1];
    if (!next) {
      d += ` L${round(x)} ${round(y)}`;
      break;
    }
    d += ` Q${round(x)} ${round(y)} ${round((x + next[0]) / 2)} ${round((y + next[1]) / 2)}`;
  }
  return d;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
