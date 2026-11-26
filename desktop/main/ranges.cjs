// @ts-check
/**
 * Pure helpers for HTTP byte ranges (used by stream-protocol.cjs, tested in
 * ranges.test.cjs).
 */

/** Answer at most this many bytes per request: googlevideo throttles very large ranges. */
const MAX_CHUNK_BYTES = 8 * 1024 * 1024;

/**
 * Turns the media element's `Range` header into a closed byte range inside the file.
 * Open-ended ranges ("bytes=100-") are capped to `maxChunk`; the element asks for more.
 * @param {string | null} header
 * @param {number} size  total size in bytes
 * @param {number} [maxChunk]
 * @returns {{ start: number, end: number } | null}  null when the range is not satisfiable
 */
function parseRange(header, size, maxChunk = MAX_CHUNK_BYTES) {
  const match = /^bytes=(\d*)-(\d*)$/.exec((header ?? '').trim());
  let start = 0;
  let end = size - 1;
  if (match) {
    const [, from = '', to = ''] = match;
    if (from === '' && to !== '') {
      // suffix range: the last N bytes
      start = Math.max(0, size - Number(to));
    } else {
      start = Number(from || 0);
      if (to !== '') end = Number(to);
    }
  }
  if (start >= size || start > end) return null;
  end = Math.min(end, size - 1, start + maxChunk - 1);
  return { start, end };
}

/**
 * Upstream request for a range, in the style the stream URL accepts.
 * @param {string} url
 * @param {{ start: number, end: number }} range
 * @param {'header' | 'query'} style
 * @returns {{ url: string, headers: Record<string, string> }}
 */
function upstreamRequest(url, range, style) {
  if (style === 'query') return { url: `${url}&range=${range.start}-${range.end}`, headers: {} };
  return { url, headers: { Range: `bytes=${range.start}-${range.end}` } };
}

module.exports = { parseRange, upstreamRequest, MAX_CHUNK_BYTES };
