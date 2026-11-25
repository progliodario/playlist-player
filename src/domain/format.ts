/**
 * Display formatting helpers that do not depend on the UI language.
 * Language-dependent text lives in src/i18n/.
 */

/** 182 -> "3:02", 3723 -> "1:02:03", null -> "" */
export function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds === null || !Number.isFinite(totalSeconds) || totalSeconds < 0) return '';
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`;
  return `${minutes}:${ss}`;
}

/**
 * Parses the ISO 8601 durations used by the YouTube Data API ("PT3M2S", "P1DT2H", "PT45S").
 * Returns null for anything it does not understand (e.g. live streams report "P0D").
 */
export function parseIsoDuration(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value);
  if (!match) return null;
  const [, d = '0', h = '0', m = '0', s = '0'] = match;
  const total = Number(d) * 86400 + Number(h) * 3600 + Number(m) * 60 + Number(s);
  return total > 0 ? total : null;
}

/**
 * Turns a channel name into a readable artist name:
 * "Diodato - Topic" -> "Diodato", "ArtistVEVO" -> "Artist", "MRRAINOFFICIAL" stays as is.
 */
export function artistFromChannel(channelTitle: string): string {
  return channelTitle
    .replace(/\s-\sTopic$/i, '')
    .replace(/VEVO$/i, '')
    .trim();
}

/** Case- and accent-insensitive "contains" used by the search boxes. */
export function matchesSearch(text: string, query: string): boolean {
  const q = normalizeForSearch(query);
  if (!q) return true;
  return normalizeForSearch(text).includes(q);
}

export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
