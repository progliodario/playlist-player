// @ts-check
/** Remembers the window size, position and maximized state between launches. */
const fs = require('node:fs');
const path = require('node:path');
const { screen } = require('electron');

/** @typedef {{ x?: number, y?: number, width: number, height: number, maximized: boolean }} WindowState */

const DEFAULT_STATE = { width: 1280, height: 820, maximized: false };

/**
 * @param {string} dataDir
 * @returns {WindowState}
 */
function loadWindowState(dataDir) {
  try {
    /** @type {WindowState} */
    const saved = JSON.parse(fs.readFileSync(path.join(dataDir, 'window-state.json'), 'utf8'));
    const visible = screen.getAllDisplays().some(({ workArea }) => {
      const x = saved.x ?? workArea.x;
      const y = saved.y ?? workArea.y;
      return (
        x < workArea.x + workArea.width &&
        x + saved.width > workArea.x &&
        y < workArea.y + workArea.height &&
        y + saved.height > workArea.y
      );
    });
    return visible ? { ...DEFAULT_STATE, ...saved } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * @param {string} dataDir
 * @param {import('electron').BrowserWindow} window
 */
function trackWindowState(dataDir, window) {
  const save = () => {
    const bounds = window.getNormalBounds();
    /** @type {WindowState} */
    const state = { ...bounds, maximized: window.isMaximized() };
    try {
      fs.writeFileSync(path.join(dataDir, 'window-state.json'), JSON.stringify(state));
    } catch {
      // not important
    }
  };
  window.on('close', save);
}

module.exports = { loadWindowState, trackWindowState };
