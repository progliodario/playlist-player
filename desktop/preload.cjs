// @ts-check
/**
 * Bridge between the web app and the Windows app. Runs in an isolated, sandboxed context
 * and exposes only these calls as window.playlistPlayerDesktop
 * (contract: src/platform/desktop-bridge.ts, implementation: main/ipc.cjs).
 */
const { contextBridge, ipcRenderer } = require('electron');

const versionArg = process.argv.find((arg) => arg.startsWith('--pp-version='));

contextBridge.exposeInMainWorld('playlistPlayerDesktop', {
  version: versionArg ? versionArg.slice('--pp-version='.length) : '',
  /** @param {string} videoId @param {{ video: boolean, refresh?: boolean }} options */
  resolve: (videoId, options) => ipcRenderer.invoke('pp:resolve', videoId, options),
  /** @param {string} videoId */
  prefetch: (videoId) => ipcRenderer.send('pp:prefetch', videoId),
  /** @param {{ clientId: string, scope: string, prompt: string }} options */
  signIn: (options) => ipcRenderer.invoke('pp:sign-in', options),
});
