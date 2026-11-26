// @ts-check
/**
 * `ppstream://media/audio/<videoId>`: serves the audio stream of a video to the page.
 *
 * The <video> element of the web app (src/player/stream-player-engine.ts) points here
 * instead of at googlevideo.com directly, so that the app can:
 *  - send byte ranges in the form each stream wants (header or `&range=`, ranges.cjs);
 *  - use the User-Agent the URL was issued for;
 *  - look the video up again when its URL expires (HTTP 403), without the page noticing.
 */
const { appInfo } = require('./config.cjs');
const { isVideoId } = require('./formats.cjs');
const { parseRange, upstreamRequest } = require('./ranges.cjs');

/** @typedef {import('./ytdlp.cjs').YtDlp} YtDlp */
/** @typedef {import('./formats.cjs').Resolution} Resolution */

/**
 * @param {YtDlp} ytdlp
 * @param {string} fallbackUserAgent
 * @returns {(request: Request) => Promise<Response>}
 */
function createStreamHandler(ytdlp, fallbackUserAgent) {
  return async (request) => {
    const url = new URL(request.url);
    const [kind, videoId] = url.pathname.split('/').filter(Boolean);
    if (url.hostname !== 'media' || kind !== 'audio' || !isVideoId(videoId)) {
      return new Response('Not found', { status: 404 });
    }
    const id = /** @type {string} */ (videoId);
    try {
      let resolution = await ytdlp.resolve(id);
      let response = await fetchRange(resolution, request, fallbackUserAgent);
      if (response.status === 403 || response.status === 410) {
        // Expired or rejected URL: look the video up again once.
        resolution = await ytdlp.resolve(id, { refresh: true });
        response = await fetchRange(resolution, request, fallbackUserAgent);
      }
      return response;
    } catch (error) {
      console.error(`[${appInfo.appName}] stream ${id}:`, error);
      return new Response('Unavailable', { status: 502 });
    }
  };
}

/**
 * @param {Resolution} resolution
 * @param {Request} request
 * @param {string} fallbackUserAgent
 * @returns {Promise<Response>}
 */
async function fetchRange(resolution, request, fallbackUserAgent) {
  const { audio } = resolution;
  const range = parseRange(request.headers.get('Range'), audio.size);
  if (!range) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${audio.size}` },
    });
  }
  const upstream = upstreamRequest(audio.url, range, audio.rangeStyle);
  const response = await fetch(upstream.url, {
    headers: { ...upstream.headers, 'User-Agent': resolution.userAgent ?? fallbackUserAgent },
  });
  if (!response.ok) {
    await response.body?.cancel();
    return new Response(null, { status: response.status });
  }
  return new Response(response.body, {
    status: 206,
    headers: {
      'Content-Type': audio.mime,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(range.end - range.start + 1),
      'Content-Range': `bytes ${range.start}-${range.end}/${audio.size}`,
      'Cache-Control': 'no-store',
    },
  });
}

module.exports = { createStreamHandler };
