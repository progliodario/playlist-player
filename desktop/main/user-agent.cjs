// @ts-check
/**
 * A standard Chrome-on-Windows User-Agent for the Chromium version inside Electron,
 * without the "Electron/x" and app-name tokens: googlevideo.com and some Google pages
 * treat unknown browsers differently. Pure: tested in user-agent.test.cjs.
 * @param {string} chromeVersion  process.versions.chrome, e.g. "156.0.8078.109"
 */
function chromeUserAgent(chromeVersion) {
  const major = chromeVersion.split('.')[0] ?? '0';
  // Chrome itself reports only the major version ("reduced User-Agent").
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`;
}

module.exports = { chromeUserAgent };
