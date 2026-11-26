// @ts-check
/**
 * Packaging of the Windows app (electron-builder). Run `npm run dist` in desktop/;
 * the installer lands in desktop/dist/playlist-player-setup.exe.
 * Name, id and version come from generated/app-info.json (scripts/prepare.cjs).
 */
const info = require('./generated/app-info.json');

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: info.desktopAppId,
  productName: info.appName,
  copyright: 'MIT License',
  directories: { output: 'dist', buildResources: 'generated' },
  files: [
    'main/**/*.cjs',
    '!main/**/*.test.cjs',
    'preload.cjs',
    'offline.html',
    'generated/app-info.json',
    'generated/icon.png',
    'package.json',
  ],
  extraMetadata: { version: info.version, description: info.description },
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'generated/icon.png',
  },
  nsis: {
    oneClick: true,
    perMachine: false,
    // Stable name: .../releases/latest/download/playlist-player-setup.exe always works.
    artifactName: 'playlist-player-setup.exe',
    shortcutName: info.appName,
    deleteAppDataOnUninstall: false,
  },
  publish: null,
};
