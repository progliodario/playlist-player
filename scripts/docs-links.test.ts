/**
 * Keeps the documentation navigable: every relative link in the Markdown files must point
 * to a file that exists. Runs with `npm test` (and so in CI), so a renamed or deleted file
 * cannot leave dead links behind.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'dist', 'dev-dist', '.git', 'generated', 'build']);

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return SKIP_DIRS.has(name) ? [] : markdownFiles(full);
    return name.endsWith('.md') ? [full] : [];
  });
}

/** Relative link targets of a Markdown text: [text](target), without #anchors. */
function relativeLinks(markdown: string): string[] {
  return [...markdown.matchAll(/\]\(([^)\s]+)\)/g)]
    .map((match) => match[1] ?? '')
    .filter((href) => href && !/^(https?:|mailto:|#)/.test(href))
    .map((href) => decodeURIComponent(href.split('#')[0] ?? ''))
    .filter(Boolean);
}

describe('documentation links', () => {
  const files = [
    ...markdownFiles(path.join(ROOT, 'docs')),
    ...markdownFiles(path.join(ROOT, '.github')),
    ...[
      'README.md',
      'AGENTS.md',
      'CLAUDE.md',
      'CHANGELOG.md',
      'android/README.md',
      'desktop/README.md',
    ].map((f) => path.join(ROOT, f)),
  ];

  it('finds the documentation', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it.each(files.map((f) => [path.relative(ROOT, f), f]))('%s has no broken links', (_, file) => {
    const broken = relativeLinks(readFileSync(file, 'utf8')).filter(
      (href) => !existsSync(path.resolve(path.dirname(file), href)),
    );
    expect(broken).toEqual([]);
  });
});
