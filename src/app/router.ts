/**
 * Tiny hash router. Hash URLs (#/...) work on GitHub Pages without server rewrites and
 * inside the Android wrapper.
 *
 *   #/                  library
 *   #/playlist/<key>    one playlist (key = makePlaylistKey(), URI-encoded)
 *   #/now               now playing + full queue (mainly for phones)
 *   #/settings          settings
 *
 * To add a page: extend Route, parseHash() and routeHref(), then render it in App.tsx.
 */
import { useSyncExternalStore } from 'react';

export type Route =
  { name: 'library' } | { name: 'playlist'; key: string } | { name: 'now' } | { name: 'settings' };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/^\/+/, '');
  const [first = '', ...rest] = path.split('/');
  switch (first) {
    case 'playlist': {
      const key = safeDecode(rest.join('/'));
      return key ? { name: 'playlist', key } : { name: 'library' };
    }
    case 'now':
      return { name: 'now' };
    case 'settings':
      return { name: 'settings' };
    default:
      return { name: 'library' };
  }
}

export function routeHref(route: Route): string {
  switch (route.name) {
    case 'library':
      return '#/';
    case 'playlist':
      return `#/playlist/${encodeURIComponent(route.key)}`;
    case 'now':
      return '#/now';
    case 'settings':
      return '#/settings';
  }
}

export function navigate(route: Route): void {
  window.location.hash = routeHref(route);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const getHash = () => window.location.hash;

/** Current route; re-renders on navigation. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash, getHash);
  return parseHash(hash);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
}
