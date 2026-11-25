/**
 * i18n entry point. Components call `const t = useStrings()` and read `t.section.key`.
 * Adding a language: create xx.ts typed as `Strings`, add it to DICTIONARIES and to
 * LanguageSetting in src/state/settings-store.ts.
 */
import { useSettingsStore, type LanguageSetting } from '../state/settings-store.ts';
import { en } from './en.ts';
import { it, type Strings } from './it.ts';

const DICTIONARIES = { it, en } satisfies Record<Exclude<LanguageSetting, 'auto'>, Strings>;

export type { Strings };

export function resolveLanguage(setting: LanguageSetting): keyof typeof DICTIONARIES {
  if (setting !== 'auto') return setting;
  const browser = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'it';
  return browser.startsWith('it') ? 'it' : 'en';
}

export function useStrings(): Strings {
  const setting = useSettingsStore((s) => s.language);
  return DICTIONARIES[resolveLanguage(setting)];
}

export function getStrings(): Strings {
  return DICTIONARIES[resolveLanguage(useSettingsStore.getState().language)];
}

/** "2026-11-22" -> "22 nov 2026" in the UI language. */
export function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** 6482 -> "1 h 48 min" (locale independent abbreviations). */
export function formatLongDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}
