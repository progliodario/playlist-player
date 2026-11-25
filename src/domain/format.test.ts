import { describe, expect, it } from 'vitest';
import { artistFromChannel, formatDuration, matchesSearch, parseIsoDuration } from './format.ts';
import { makePlaylistKey, parsePlaylistKey, totalDuration } from './types.ts';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [182, '3:02'],
    [3723, '1:02:03'],
    [null, ''],
    [-1, ''],
  ])('%s -> %s', (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });
});

describe('parseIsoDuration', () => {
  it.each([
    ['PT3M2S', 182],
    ['PT45S', 45],
    ['PT1H2M3S', 3723],
    ['P1DT1S', 86401],
    ['PT10M', 600],
    ['P0D', null],
    ['', null],
    [null, null],
    ['garbage', null],
  ])('%s -> %s', (input, expected) => {
    expect(parseIsoDuration(input)).toBe(expected);
  });
});

describe('artistFromChannel', () => {
  it('removes Topic and VEVO suffixes', () => {
    expect(artistFromChannel('Diodato - Topic')).toBe('Diodato');
    expect(artistFromChannel('AJRVEVO')).toBe('AJR');
    expect(artistFromChannel('sangiovanni')).toBe('sangiovanni');
  });
});

describe('matchesSearch', () => {
  it('ignores case and accents', () => {
    expect(matchesSearch('COSMÓ', 'cosmo')).toBe(true);
    expect(matchesSearch('Lucio Corsi', 'CORSI')).toBe(true);
    expect(matchesSearch('Lucio Corsi', 'dalla')).toBe(false);
    expect(matchesSearch('anything', '   ')).toBe(true);
  });
});

describe('playlist keys', () => {
  it('round-trips', () => {
    const key = makePlaylistKey('catalog', 'PLabc:def');
    expect(parsePlaylistKey(key)).toEqual({ source: 'catalog', id: 'PLabc:def' });
  });

  it('rejects malformed keys', () => {
    expect(parsePlaylistKey('nope')).toBeNull();
    expect(parsePlaylistKey('other:PL1')).toBeNull();
    expect(parsePlaylistKey('catalog:')).toBeNull();
  });
});

describe('totalDuration', () => {
  it('sums known durations', () => {
    expect(
      totalDuration([{ durationSeconds: 10 }, { durationSeconds: null }, { durationSeconds: 5 }]),
    ).toBe(15);
    expect(totalDuration([{ durationSeconds: null }])).toBeNull();
  });
});
