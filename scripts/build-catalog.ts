/**
 * Builds the public playlist catalog of the channel configured in app.config.json.
 *
 * Output (consumed by src/sources/catalog/catalog-source.ts):
 *   <out>/index.json                 list of playlists (CatalogIndex)
 *   <out>/playlists/<id>.json        tracks of each playlist (CatalogPlaylistFile)
 *
 * Usage:
 *   npm run catalog                                   -> writes public/catalog/
 *   npm run catalog -- --limit 3                      -> only the first 3 playlists (quick test)
 *   npm run catalog -- --out dist/catalog
 *   npm run catalog -- --fallback-url https://<site>/catalog/
 *        if YouTube cannot be read (e.g. rate limiting in CI), reuse the files that are
 *        already published at that URL instead of failing the deploy.
 *   npm run catalog -- --fallback-to-published
 *        same, using app.config.json -> publicUrl + "catalog/" (what CI uses).
 *
 * Requirements: Node >= 24 and yt-dlp (https://github.com/yt-dlp/yt-dlp).
 * The yt-dlp command is "yt-dlp" by default; set the YT_DLP environment variable to use
 * another path, e.g. YT_DLP="python -m yt_dlp".
 *
 * Only metadata is read (titles, durations, ids). Nothing is downloaded.
 */
import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs, promisify } from 'node:util';
import appConfig from '../app.config.json' with { type: 'json' };
import { classifyPlaylist } from '../src/domain/classify.ts';
import type { PlaylistKind, Track } from '../src/domain/types.ts';
import { totalDuration } from '../src/domain/types.ts';
import {
  CATALOG_SCHEMA_VERSION,
  type CatalogIndex,
  type CatalogPlaylistFile,
  type CatalogPlaylistSummary,
} from '../src/sources/catalog/catalog-schema.ts';

const execFileAsync = promisify(execFile);

const CONCURRENCY = 4;
const MAX_ATTEMPTS = 3;
/** Fail the run when more than this share of playlists cannot be read. */
const MAX_FAILURE_RATIO = 0.5;
const UNAVAILABLE_TITLES = new Set(['[Private video]', '[Deleted video]', '[Unavailable video]']);
const UNAVAILABLE_STATES = new Set(['private', 'needs_auth', 'subscriber_only', 'premium_only']);

// --- yt-dlp JSON shapes (only the fields we use) ------------------------------------

interface YtDlpEntry {
  id?: string;
  title?: string;
  channel?: string | null;
  uploader?: string | null;
  duration?: number | null;
  availability?: string | null;
}

interface YtDlpPlaylist {
  id?: string;
  title?: string;
  description?: string | null;
  channel?: string | null;
  channel_id?: string | null;
  uploader?: string | null;
  modified_date?: string | null; // YYYYMMDD
  entries?: YtDlpEntry[];
}

// --- main ----------------------------------------------------------------------------

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      out: { type: 'string', default: 'public/catalog' },
      limit: { type: 'string' },
      'fallback-url': { type: 'string' },
      'fallback-to-published': { type: 'boolean', default: false },
    },
  });
  const outDir = path.resolve(values.out);
  const limit = values.limit ? Number(values.limit) : Infinity;
  const fallbackUrl = values['fallback-url']
    ? ensureTrailingSlash(values['fallback-url'])
    : values['fallback-to-published']
      ? `${ensureTrailingSlash(appConfig.publicUrl)}catalog/`
      : null;

  try {
    await buildFromYouTube(outDir, limit, fallbackUrl);
  } catch (error) {
    if (!fallbackUrl) throw error;
    log(`YouTube extraction failed (${String(error)}). Falling back to ${fallbackUrl}`);
    await copyPublishedCatalog(fallbackUrl, outDir);
  }
}

async function buildFromYouTube(outDir: string, limit: number, fallbackUrl: string | null) {
  const handle = appConfig.youtube.channelHandle;
  const channelUrl = `https://www.youtube.com/${handle}`;
  log(`Reading playlists of ${channelUrl}`);
  const channel = await ytDlpJson<YtDlpPlaylist>(`${channelUrl}/playlists`);

  const excluded = new Set(appConfig.youtube.excludedPlaylistIds as string[]);
  const ids = unique([
    ...(channel.entries ?? []).map((e) => e.id).filter((id): id is string => Boolean(id)),
    ...(appConfig.youtube.extraPlaylistIds as string[]),
  ])
    .filter((id) => !excluded.has(id))
    .slice(0, limit);
  log(`Found ${ids.length} playlists`);

  const overrides = appConfig.youtube.kindOverrides as Record<string, PlaylistKind>;
  const results = await mapWithConcurrency(ids, CONCURRENCY, async (id, i) => {
    try {
      const file = await withRetries(() => readPlaylist(id));
      log(`[${i + 1}/${ids.length}] ${file.title} (${file.tracks.length} tracks)`);
      return file;
    } catch (error) {
      log(`[${i + 1}/${ids.length}] FAILED ${id}: ${String(error)}`);
      return fallbackUrl ? fetchPublishedPlaylist(fallbackUrl, id) : null;
    }
  });

  const files = results.filter((f): f is CatalogPlaylistFile => f !== null);
  const failed = ids.length - files.length;
  if (ids.length > 0 && failed / ids.length > MAX_FAILURE_RATIO) {
    throw new Error(`${failed} of ${ids.length} playlists could not be read`);
  }

  const index: CatalogIndex = {
    schemaVersion: CATALOG_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    channel: {
      id: channel.channel_id ?? '',
      handle,
      title: channel.channel ?? channel.uploader ?? handle,
      url: channelUrl,
    },
    playlists: files.map((file) => summarize(file, overrides[file.id], channel)),
  };

  await writeCatalog(outDir, index, files);
  log(`Catalog written to ${outDir} (${files.length} playlists, ${failed} failed)`);
}

async function readPlaylist(id: string): Promise<CatalogPlaylistFile & { meta: YtDlpPlaylist }> {
  const data = await ytDlpJson<YtDlpPlaylist>(
    `https://www.youtube.com/playlist?list=${encodeURIComponent(id)}`,
  );
  const tracks: Track[] = (data.entries ?? []).filter(isPlayableEntry).map((entry) => ({
    videoId: entry.id as string,
    title: entry.title ?? '',
    channelTitle: entry.channel ?? entry.uploader ?? '',
    durationSeconds: typeof entry.duration === 'number' ? Math.round(entry.duration) : null,
  }));
  return { schemaVersion: CATALOG_SCHEMA_VERSION, id, title: data.title ?? id, tracks, meta: data };
}

function summarize(
  file: CatalogPlaylistFile & { meta?: YtDlpPlaylist },
  override: PlaylistKind | undefined,
  channel: YtDlpPlaylist,
): CatalogPlaylistSummary {
  const meta = file.meta;
  return {
    id: file.id,
    title: file.title,
    description: meta?.description ?? '',
    itemCount: file.tracks.length,
    thumbnailVideoId: file.tracks[0]?.videoId ?? null,
    detectedKind: override ?? classifyPlaylist(file.title, file.tracks),
    updatedAt: formatYtDlpDate(meta?.modified_date ?? null),
    totalDurationSeconds: totalDuration(file.tracks),
    ownerName: meta?.channel ?? meta?.uploader ?? channel.channel ?? null,
  };
}

async function writeCatalog(outDir: string, index: CatalogIndex, files: CatalogPlaylistFile[]) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(path.join(outDir, 'playlists'), { recursive: true });
  for (const file of files) {
    const clean: CatalogPlaylistFile = {
      schemaVersion: file.schemaVersion,
      id: file.id,
      title: file.title,
      tracks: file.tracks,
    };
    await writeFile(path.join(outDir, 'playlists', `${file.id}.json`), JSON.stringify(clean));
  }
  await writeFile(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2));
}

// --- fallback: reuse the already published catalog ----------------------------------

async function copyPublishedCatalog(baseUrl: string, outDir: string): Promise<void> {
  const index = await fetchJson<CatalogIndex>(`${baseUrl}index.json`);
  const files = await mapWithConcurrency(index.playlists, CONCURRENCY, (p) =>
    fetchPublishedPlaylist(baseUrl, p.id),
  );
  const available = files.filter((f): f is CatalogPlaylistFile => f !== null);
  const availableIds = new Set(available.map((f) => f.id));
  index.playlists = index.playlists.filter((p) => availableIds.has(p.id));
  await writeCatalog(outDir, index, available);
  log(`Copied published catalog (${available.length} playlists, generated ${index.generatedAt})`);
}

async function fetchPublishedPlaylist(baseUrl: string, id: string) {
  try {
    return await fetchJson<CatalogPlaylistFile>(
      `${baseUrl}playlists/${encodeURIComponent(id)}.json`,
    );
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return (await response.json()) as T;
}

// --- yt-dlp ----------------------------------------------------------------------------

async function ytDlpJson<T>(url: string): Promise<T> {
  const [command, ...prefixArgs] = (process.env.YT_DLP ?? 'yt-dlp').split(' ').filter(Boolean);
  const args = [...prefixArgs, '--flat-playlist', '--dump-single-json', '--no-warnings', url];
  const { stdout } = await execFileAsync(command as string, args, {
    maxBuffer: 256 * 1024 * 1024,
    windowsHide: true,
  });
  return JSON.parse(stdout) as T;
}

function isPlayableEntry(entry: YtDlpEntry): boolean {
  if (!entry.id || !/^[A-Za-z0-9_-]{11}$/.test(entry.id)) return false;
  if (entry.title && UNAVAILABLE_TITLES.has(entry.title)) return false;
  if (entry.availability && UNAVAILABLE_STATES.has(entry.availability)) return false;
  return true;
}

// --- small utilities -------------------------------------------------------------------

async function withRetries<T>(task: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) await sleep(2000 * attempt);
    }
  }
  throw lastError;
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index] as T, index);
    }
  });
  await Promise.all(runners);
  return results;
}

/** "20261122" -> "2026-11-22" */
function formatYtDlpDate(value: string | null): string | null {
  if (!value || !/^\d{8}$/.test(value)) return null;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message: string): void {
  console.log(`[catalog] ${message}`);
}

main().catch((error: unknown) => {
  console.error('[catalog] FAILED:', error);
  process.exitCode = 1;
});
