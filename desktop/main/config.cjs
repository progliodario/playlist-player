// @ts-check
/**
 * Constants of the Windows app. Identity comes from generated/app-info.json, written by
 * scripts/prepare.cjs from ../app.config.json (never edit it by hand).
 */
const path = require('node:path');

/** @type {{ appName: string, description: string, publicUrl: string, repositoryUrl: string, themeColor: string, desktopAppId: string, version: string }} */
const appInfo = require(path.join(__dirname, '..', 'generated', 'app-info.json'));

/**
 * Page loaded in the window. PP_APP_URL overrides it for local tests, e.g.
 * PP_APP_URL=http://localhost:5173/playlist-player/ (see docs/sviluppo/app-windows.md).
 */
const appUrl = process.env.PP_APP_URL || appInfo.publicUrl;
const appOrigin = new URL(appUrl).origin;

/** Custom protocol that serves audio streams to the page (main/stream-protocol.cjs). */
const STREAM_SCHEME = 'ppstream';

/**
 * Fixed loopback port for Google sign-in in the system browser. Its redirect URI,
 * http://127.0.0.1:43117/callback, is registered in the Google Cloud OAuth client
 * (docs/sviluppo/account-google.md). Change both together.
 */
const SIGN_IN_PORT = 43117;

module.exports = { appInfo, appUrl, appOrigin, STREAM_SCHEME, SIGN_IN_PORT };
