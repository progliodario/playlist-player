/**
 * Every localStorage key used by the app, in one place.
 * If you change the shape of persisted data, bump the store's `version` and add a
 * `migrate` function in that store (see zustand persist docs) instead of renaming keys.
 */
export const STORAGE_KEYS = {
  settings: 'pp:settings',
  player: 'pp:player',
  playerResumeTime: 'pp:player:resume-time',
  auth: 'pp:auth',
  manualTitles: 'pp:manual:video-titles',
} as const;

/** localStorage that never throws (private mode, quota, disabled storage). */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore: persistence is a convenience, never a requirement
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
