import { describe, expect, it } from 'vitest';
import { parseHash, routeHref, type Route } from './router.ts';

describe('router', () => {
  it.each<[string, Route]>([
    ['', { name: 'library' }],
    ['#/', { name: 'library' }],
    ['#/unknown', { name: 'library' }],
    ['#/settings', { name: 'settings' }],
    ['#/now', { name: 'now' }],
    ['#/playlist/catalog%3APLabc', { name: 'playlist', key: 'catalog:PLabc' }],
    ['#/playlist/', { name: 'library' }],
    ['#/playlist/%E0%A4%A', { name: 'library' }],
  ])('parses %s', (hash, expected) => {
    expect(parseHash(hash)).toEqual(expected);
  });

  it('round-trips playlist routes', () => {
    const route: Route = { name: 'playlist', key: 'manual:PL-x_y' };
    expect(parseHash(routeHref(route))).toEqual(route);
  });
});
