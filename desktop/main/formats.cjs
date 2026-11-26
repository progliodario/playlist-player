// @ts-check
/**
 * Pure helpers: choose the streams to play from yt-dlp's JSON output (`yt-dlp -J`).
 * No Electron, no I/O: covered by formats.test.cjs.
 */

/**
 * @typedef {object} YtFormat
 * @property {string} [format_id]
 * @property {string} [url]
 * @property {string} [manifest_url]
 * @property {string} [protocol]
 * @property {string} [vcodec]
 * @property {string} [acodec]
 * @property {string} [ext]
 * @property {number} [abr]
 * @property {number} [filesize]
 * @property {number} [filesize_approx]
 */

/**
 * @typedef {object} YtInfo
 * @property {string} [title]
 * @property {number} [duration]
 * @property {YtFormat[]} [formats]
 * @property {Record<string, string>} [http_headers]
 */

/**
 * @typedef {object} AudioStream
 * @property {string} url
 * @property {number} size   Bytes (needed to answer range requests).
 * @property {string} mime
 * @property {'header' | 'query'} rangeStyle  How googlevideo wants byte ranges.
 */

/**
 * @typedef {object} Resolution
 * @property {AudioStream} audio
 * @property {string | null} hlsUrl  HLS manifest with video (video playlists).
 * @property {number} durationSeconds
 * @property {string} title
 * @property {string | null} userAgent  User-Agent yt-dlp used (googlevideo may check it).
 * @property {number} expiresAt  Epoch ms after which the URLs must be resolved again.
 */

/** Stream URLs normally last 6 hours; refresh a bit earlier. */
const EXPIRY_MARGIN_MS = 30 * 60 * 1000;
const DEFAULT_LIFETIME_MS = 4 * 60 * 60 * 1000;

/**
 * Some YouTube clients (e.g. TVHTML5) refuse the Range header but accept `&range=a-b` in
 * the URL, like yt-dlp itself does.
 * @param {string} client  value of the `c` URL parameter
 * @returns {'header' | 'query'}
 */
function rangeStyleFor(client) {
  return client.startsWith('TV') ? 'query' : 'header';
}

/**
 * @param {YtInfo} info
 * @param {number} now  Date.now()
 * @returns {Resolution | null}  null when there is no playable audio
 */
function pickStreams(info, now) {
  const formats = info.formats ?? [];
  const audioFormats = formats
    .filter(
      (f) =>
        f.url &&
        f.protocol === 'https' &&
        (f.vcodec === 'none' || !f.vcodec) &&
        f.acodec &&
        f.acodec !== 'none',
    )
    .sort((a, b) => (b.abr ?? 0) - (a.abr ?? 0));
  const best = audioFormats[0];
  if (!best || !best.url) return null;

  const url = new URL(best.url);
  const size = best.filesize ?? best.filesize_approx ?? Number(url.searchParams.get('clen') ?? 0);
  if (!size) return null;
  const expireSeconds = Number(url.searchParams.get('expire') ?? 0);
  const expiresAt = expireSeconds
    ? expireSeconds * 1000 - EXPIRY_MARGIN_MS
    : now + DEFAULT_LIFETIME_MS;

  const hls = formats.find((f) => f.protocol?.startsWith('m3u8') && f.manifest_url);
  return {
    audio: {
      url: best.url,
      size,
      mime: best.ext === 'webm' ? 'audio/webm' : 'audio/mp4',
      rangeStyle: rangeStyleFor(url.searchParams.get('c') ?? ''),
    },
    hlsUrl: hls?.manifest_url ?? null,
    durationSeconds: info.duration ?? 0,
    title: info.title ?? '',
    userAgent: info.http_headers?.['User-Agent'] ?? null,
    expiresAt,
  };
}

/**
 * YouTube video ids are 11 characters of [A-Za-z0-9_-].
 * @param {unknown} value
 * @returns {value is string}
 */
function isVideoId(value) {
  return typeof value === 'string' && /^[\w-]{11}$/.test(value);
}

module.exports = { pickStreams, rangeStyleFor, isVideoId };
