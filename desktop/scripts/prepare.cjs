// @ts-check
/**
 * Copies the project identity into the desktop app before running or packaging it:
 *  - ../app.config.json + ../package.json version -> generated/app-info.json
 *  - ../public/icons/icon-512.png                -> generated/icon.png (window and installer)
 * app.config.json stays the single source of truth (AGENTS.md, rule 5).
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const out = path.resolve(__dirname, '..', 'generated');
fs.mkdirSync(out, { recursive: true });

const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.config.json'), 'utf8'));
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const info = {
  appName: appConfig.appName,
  description: appConfig.description,
  publicUrl: appConfig.publicUrl,
  repositoryUrl: appConfig.repositoryUrl,
  themeColor: appConfig.themeColor,
  // Windows app id: Android application id + ".desktop" (shown nowhere, must stay stable).
  desktopAppId: `${appConfig.android.applicationId}.desktop`,
  version,
};
fs.writeFileSync(path.join(out, 'app-info.json'), `${JSON.stringify(info, null, 2)}\n`);
fs.copyFileSync(path.join(root, 'public', 'icons', 'icon-512.png'), path.join(out, 'icon.png'));
console.log(`desktop: prepared ${info.appName} ${version}`);
