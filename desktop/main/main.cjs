// @ts-check
/**
 * Windows app of Playlist Player (Electron). See docs/sviluppo/app-windows.md.
 *
 * The window shows the published web app (always up to date, like the browser version).
 * What the app adds is the ad-free player: the page asks for a video through the bridge
 * (preload.cjs -> ipc.cjs), yt-dlp finds its streams (ytdlp.cjs) and the audio is served
 * by ppstream:// (stream-protocol.cjs). It keeps playing with the window minimized.
 */
const path = require('node:path');
const { app, BrowserWindow, protocol, session, shell } = require('electron');
const { appInfo, appOrigin, appUrl, STREAM_SCHEME } = require('./config.cjs');
const { registerIpc } = require('./ipc.cjs');
const { createStreamHandler } = require('./stream-protocol.cjs');
const { chromeUserAgent } = require('./user-agent.cjs');
const { loadWindowState, trackWindowState } = require('./window-state.cjs');
const { YtDlp } = require('./ytdlp.cjs');

protocol.registerSchemesAsPrivileged([
  {
    scheme: STREAM_SCHEME,
    privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true },
  },
]);
// The next track must start by itself after the previous one ends.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// A plain Chrome User-Agent: some Google services treat "Electron" differently.
app.userAgentFallback = chromeUserAgent(process.versions.chrome);
app.setAppUserModelId(appInfo.desktopAppId);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  /** @type {BrowserWindow | null} */
  let mainWindow = null;
  const ytdlp = new YtDlp(app.getPath('userData'), process.execPath);

  const focusWindow = () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  };

  app.on('second-instance', focusWindow);
  app.on('window-all-closed', () => app.quit());

  app.whenReady().then(() => {
    protocol.handle(STREAM_SCHEME, createStreamHandler(ytdlp, app.userAgentFallback));
    allowHlsRequests();
    registerIpc(ytdlp, focusWindow);
    mainWindow = createWindow();
    // Download yt-dlp now (first launch) and update it later, without blocking the window.
    ytdlp
      .ensureInstalled()
      .catch((error) => console.error('yt-dlp install failed:', error))
      .then(() => setTimeout(() => void ytdlp.updateIfDue(), 30_000));
  });

  function createWindow() {
    const dataDir = app.getPath('userData');
    const state = loadWindowState(dataDir);
    const window = new BrowserWindow({
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
      minWidth: 320,
      minHeight: 480,
      title: appInfo.appName,
      backgroundColor: appInfo.themeColor,
      icon: path.join(__dirname, '..', 'generated', 'icon.png'),
      autoHideMenuBar: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.cjs'),
        contextIsolation: true,
        sandbox: true,
        // Keep timers and media running when minimized (background playback).
        backgroundThrottling: false,
        additionalArguments: [`--pp-version=${appInfo.version}`],
      },
    });
    if (state.maximized) window.maximize();
    trackWindowState(dataDir, window);
    window.once('ready-to-show', () => window.show());

    const contents = window.webContents;
    // Links to other sites open in the default browser; the app never opens popups.
    contents.setWindowOpenHandler(({ url }) => {
      openExternal(url);
      return { action: 'deny' };
    });
    contents.on('will-navigate', (event, url) => {
      if (!isAppUrl(url)) {
        event.preventDefault();
        openExternal(url);
      }
    });
    contents.on('did-fail-load', (_event, code, _description, url, isMainFrame) => {
      if (isMainFrame && code !== -3 && isAppUrl(url)) {
        void window.loadFile(path.join(__dirname, '..', 'offline.html'), {
          query: { retry: appUrl },
        });
      }
    });
    void window.loadURL(appUrl);
    return window;
  }

  /** hls.js loads video segments with fetch: allow them, like a CORS-enabled server would. */
  function allowHlsRequests() {
    session.defaultSession.webRequest.onHeadersReceived(
      { urls: ['https://*.googlevideo.com/*'] },
      (details, callback) => {
        const headers = { ...details.responseHeaders };
        for (const name of Object.keys(headers)) {
          if (name.toLowerCase().startsWith('access-control-')) delete headers[name];
        }
        headers['Access-Control-Allow-Origin'] = [appOrigin];
        callback({ responseHeaders: headers });
      },
    );
  }
}

/** @param {string} url */
function isAppUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin === appOrigin || parsed.protocol === 'file:';
  } catch {
    return false;
  }
}

/** @param {string} url */
function openExternal(url) {
  if (/^https?:\/\//.test(url)) void shell.openExternal(url);
}
