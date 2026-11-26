// @ts-check
/**
 * Calls the web page can make (exposed by preload.cjs as window.playlistPlayerDesktop,
 * typed in src/platform/desktop-bridge.ts). Only the app's own origin may call them.
 */
const { ipcMain } = require('electron');
const { appOrigin, STREAM_SCHEME } = require('./config.cjs');
const { isVideoId } = require('./formats.cjs');
const { signInWithBrowser } = require('./google-sign-in.cjs');

const READONLY_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

/** @typedef {import('./ytdlp.cjs').YtDlp} YtDlp */

/** @param {import('electron').IpcMainInvokeEvent | import('electron').IpcMainEvent} event */
function fromApp(event) {
  try {
    return new URL(event.senderFrame?.url ?? '').origin === appOrigin;
  } catch {
    return false;
  }
}

/**
 * @param {YtDlp} ytdlp
 * @param {() => void} focusWindow
 */
function registerIpc(ytdlp, focusWindow) {
  ipcMain.handle('pp:resolve', async (event, videoId, options) => {
    if (!fromApp(event) || !isVideoId(videoId)) throw new Error('Invalid request');
    const resolution = await ytdlp.resolve(videoId, { refresh: Boolean(options?.refresh) });
    return {
      audioSrc: `${STREAM_SCHEME}://media/audio/${videoId}`,
      hlsUrl: options?.video ? resolution.hlsUrl : null,
      durationSeconds: resolution.durationSeconds,
      title: resolution.title,
    };
  });

  ipcMain.on('pp:prefetch', (event, videoId) => {
    if (fromApp(event) && isVideoId(videoId)) ytdlp.resolve(videoId).catch(() => undefined);
  });

  ipcMain.handle('pp:sign-in', (event, options) => {
    const clientId = String(options?.clientId ?? '');
    if (!fromApp(event) || !clientId.endsWith('.apps.googleusercontent.com')) {
      throw new Error('Invalid request');
    }
    if (options?.scope !== READONLY_SCOPE) throw new Error('Only the read-only scope is allowed');
    const prompt = ['consent', 'select_account'].includes(options?.prompt) ? options.prompt : '';
    return signInWithBrowser({ clientId, scope: READONLY_SCOPE, prompt }, focusWindow);
  });
}

module.exports = { registerIpc };
