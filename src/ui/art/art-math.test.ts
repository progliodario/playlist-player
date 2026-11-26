import { describe, expect, it } from 'vitest';
import { hueFromString, seededRandom, smoothPath } from './art-math.ts';

describe('hueFromString', () => {
  it('is stable and in range', () => {
    expect(hueFromString('catalog:PL1')).toBe(hueFromString('catalog:PL1'));
    for (const text of ['', 'a', 'sangiovanni', 'Margherita Vicario', 'x'.repeat(500)]) {
      const hue = hueFromString(text);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });

  it('spreads different strings', () => {
    const hues = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map(hueFromString));
    expect(hues.size).toBeGreaterThan(3);
  });
});

describe('seededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    const seqA = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(seqA);
    for (const n of seqA) expect(n).toBeGreaterThanOrEqual(0);
    for (const n of seqA) expect(n).toBeLessThan(1);
  });
});

describe('smoothPath', () => {
  it('builds a path through the points', () => {
    expect(smoothPath([])).toBe('');
    expect(smoothPath([[0, 0]])).toBe('M0 0');
    expect(
      smoothPath([
        [0, 0],
        [10, 10],
        [20, 0],
      ]),
    ).toBe('M0 0 Q10 10 15 5 L20 0');
  });
});
