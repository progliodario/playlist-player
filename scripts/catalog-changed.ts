/**
 * Tells whether the freshly built catalog (public/catalog/index.json) differs from the
 * one currently online (app.config.json -> publicUrl + "catalog/index.json").
 *
 * Usage: node scripts/catalog-changed.ts
 * Output: prints the result; inside GitHub Actions also writes `changed=true|false`
 * to $GITHUB_OUTPUT, used by .github/workflows/deploy.yml to skip useless deploys.
 *
 * When in doubt (no local file, site unreachable, old catalog without hash) it answers
 * "changed", so a deploy happens rather than being missed.
 */
import { appendFile, readFile } from 'node:fs/promises';
import appConfig from '../app.config.json' with { type: 'json' };
import type { CatalogIndex } from '../src/sources/catalog/catalog-schema.ts';

const LOCAL_INDEX = 'public/catalog/index.json';

async function main(): Promise<void> {
  const local = await readLocal();
  const published = await readPublished();
  const changed = !local?.contentHash || local.contentHash !== published?.contentHash;

  console.log(`[catalog-changed] local:     ${local?.contentHash ?? '(none)'}`);
  console.log(`[catalog-changed] published: ${published?.contentHash ?? '(none)'}`);
  console.log(`[catalog-changed] changed=${changed}`);

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  }
}

async function readLocal(): Promise<CatalogIndex | null> {
  try {
    return JSON.parse(await readFile(LOCAL_INDEX, 'utf8')) as CatalogIndex;
  } catch {
    return null;
  }
}

async function readPublished(): Promise<CatalogIndex | null> {
  const base = appConfig.publicUrl.endsWith('/') ? appConfig.publicUrl : `${appConfig.publicUrl}/`;
  try {
    const response = await fetch(`${base}catalog/index.json`, { cache: 'no-store' });
    return response.ok ? ((await response.json()) as CatalogIndex) : null;
  } catch {
    return null;
  }
}

main().catch((error: unknown) => {
  console.error('[catalog-changed] FAILED:', error);
  process.exitCode = 1;
});
