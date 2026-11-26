// @ts-check
/**
 * yt-dlp (https://github.com/yt-dlp/yt-dlp): finds the stream URLs of a video.
 *
 *  - The program is downloaded on first use into the app's data folder, checked against
 *    the SHA-256 published with the release, and updated by itself once a day
 *    (`yt-dlp -U`): YouTube changes often and yt-dlp follows within days.
 *  - Its JavaScript challenges run on the Node.js built into Electron
 *    (ELECTRON_RUN_AS_NODE), so nothing else needs to be installed.
 *  - Results are cached until the URLs expire; `refresh` forces a new lookup.
 */
const { execFile } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { pickStreams } = require('./formats.cjs');

const RELEASE_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download';
const BINARY = 'yt-dlp.exe';
const UPDATE_EVERY_MS = 24 * 60 * 60 * 1000;
const RUN_TIMEOUT_MS = 90_000;
/**
 * Player clients to ask, in order. "visionos" returns plain URLs that accept Range
 * requests; the default set is the fallback when it fails.
 */
const CLIENT_ATTEMPTS = [['--extractor-args', 'youtube:player_client=visionos'], []];

/** @typedef {import('./formats.cjs').Resolution} Resolution */

class YtDlp {
  /**
   * @param {string} dataDir  folder for the binary (inside app.getPath('userData'))
   * @param {string} nodeRuntime  Electron executable, used as Node.js (process.execPath)
   */
  constructor(dataDir, nodeRuntime) {
    this.dir = path.join(dataDir, 'yt-dlp');
    this.binary = path.join(this.dir, BINARY);
    this.nodeRuntime = nodeRuntime;
    /** @type {Promise<void> | null} */
    this.installing = null;
    /** @type {Promise<void> | null} */
    this.updating = null;
    /** @type {Map<string, Resolution>} */
    this.cache = new Map();
    /** @type {Map<string, Promise<Resolution>>} */
    this.pending = new Map();
  }

  /** Downloads yt-dlp if missing. Safe to call many times. */
  ensureInstalled() {
    if (fs.existsSync(this.binary)) return Promise.resolve();
    this.installing ??= this.download().finally(() => {
      this.installing = null;
    });
    return this.installing;
  }

  async download() {
    fs.mkdirSync(this.dir, { recursive: true });
    const [binary, sums] = await Promise.all([
      fetchBuffer(`${RELEASE_URL}/${BINARY}`),
      fetchBuffer(`${RELEASE_URL}/SHA2-256SUMS`),
    ]);
    const expected = sums
      .toString('utf8')
      .split('\n')
      .map((line) => line.trim().split(/\s+/))
      .find((parts) => parts[1] === BINARY)?.[0];
    const actual = createHash('sha256').update(binary).digest('hex');
    if (!expected || expected.toLowerCase() !== actual) {
      throw new Error('yt-dlp checksum mismatch: download refused');
    }
    const temp = `${this.binary}.download`;
    fs.writeFileSync(temp, binary);
    fs.renameSync(temp, this.binary);
    this.markUpdated();
  }

  /** Runs `yt-dlp -U` when the last update is older than a day. Never throws. */
  async updateIfDue() {
    if (this.updating || !fs.existsSync(this.binary)) return;
    const stamp = path.join(this.dir, 'last-update');
    const last = fs.existsSync(stamp) ? fs.statSync(stamp).mtimeMs : 0;
    if (Date.now() - last < UPDATE_EVERY_MS) return;
    this.updating = this.run(['-U'])
      .then(() => this.markUpdated())
      .catch(() => undefined)
      .finally(() => {
        this.updating = null;
      });
    await this.updating;
  }

  markUpdated() {
    fs.writeFileSync(path.join(this.dir, 'last-update'), new Date().toISOString());
  }

  /**
   * Stream URLs of a video (cached until they expire).
   * @param {string} videoId
   * @param {{ refresh?: boolean }} [options]
   * @returns {Promise<Resolution>}
   */
  resolve(videoId, options = {}) {
    const cached = this.cache.get(videoId);
    if (!options.refresh && cached && cached.expiresAt > Date.now()) return Promise.resolve(cached);
    const running = this.pending.get(videoId);
    if (running && !options.refresh) return running;
    const task = this.lookUp(videoId).finally(() => this.pending.delete(videoId));
    this.pending.set(videoId, task);
    return task;
  }

  /** @param {string} videoId */
  async lookUp(videoId) {
    await this.ensureInstalled();
    if (this.updating) await this.updating;
    let lastError = new Error('No playable audio');
    for (const clientArgs of CLIENT_ATTEMPTS) {
      try {
        const output = await this.run([
          '--js-runtimes',
          `node:${this.nodeRuntime}`,
          ...clientArgs,
          '-J',
          '--no-warnings',
          '--no-playlist',
          '--',
          `https://www.youtube.com/watch?v=${videoId}`,
        ]);
        const resolution = pickStreams(JSON.parse(output), Date.now());
        if (resolution) {
          this.cache.set(videoId, resolution);
          return resolution;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
    throw lastError;
  }

  /**
   * @param {string[]} args
   * @returns {Promise<string>} stdout
   */
  run(args) {
    return new Promise((resolve, reject) => {
      execFile(
        this.binary,
        args,
        {
          env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
          maxBuffer: 64 * 1024 * 1024,
          timeout: RUN_TIMEOUT_MS,
          windowsHide: true,
        },
        (error, stdout, stderr) => {
          if (error)
            reject(
              new Error(
                String(stderr || error.message)
                  .trim()
                  .slice(-500),
              ),
            );
          else resolve(stdout);
        },
      );
    });
  }
}

/** @param {string} url */
async function fetchBuffer(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

module.exports = { YtDlp };
