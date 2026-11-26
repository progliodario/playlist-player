/**
 * Guards WCAG 2.2 AA color contrast of the design tokens in tokens.css, for both themes.
 *   - text: at least 4.5:1 (SC 1.4.3)
 *   - focus ring and meaningful icons/indicators: at least 3:1 (SC 1.4.11)
 * If this test fails after a color change, adjust the color, do not lower the target.
 *
 * "*.node.test.ts" files use Node APIs (here: reading tokens.css from disk), so they are
 * type-checked with tsconfig.node.json instead of tsconfig.app.json.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./tokens.css', import.meta.url)), 'utf8');

function readBlock(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Block ${selector} not found in tokens.css`);
  const end = css.indexOf('\n}', start);
  const block = css.slice(start, end);
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[match[1] as string] = (match[2] as string).toLowerCase();
  }
  return tokens;
}

const dark = readBlock(':root');
const light = { ...dark, ...readBlock(":root[data-theme='light']") };

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r as number) + 0.7152 * (g as number) + 0.0722 * (b as number);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT_PAIRS: [string, string][] = [
  ['--text', '--bg'],
  ['--text', '--surface'],
  ['--text', '--surface-2'],
  ['--text', '--surface-3'],
  ['--text-muted', '--bg'],
  ['--text-muted', '--surface'],
  ['--text-muted', '--surface-2'],
  ['--text-muted', '--surface-3'],
  ['--text-faint', '--bg'],
  ['--text-faint', '--surface'],
  ['--text-faint', '--surface-2'],
  ['--accent-strong', '--bg'],
  ['--accent-strong', '--surface'],
  ['--accent-strong', '--surface-2'],
  ['--accent-ink', '--accent'],
  ['--accent-ink', '--violet'],
  ['--accent-ink', '--gold'],
  ['--danger', '--surface'],
  ['--success', '--surface'],
];

const UI_PAIRS: [string, string][] = [
  ['--focus', '--bg'],
  ['--focus', '--surface'],
  ['--focus', '--surface-2'],
  ['--accent', '--bg'],
  ['--accent', '--surface'],
];

describe.each([
  ['Notturno (dark)', dark],
  ['Alba (light)', light],
])('%s theme', (_name, tokens) => {
  const get = (name: string) => {
    const value = tokens[name];
    if (!value) throw new Error(`${name} is not a 6-digit hex color in tokens.css`);
    return value;
  };

  it.each(TEXT_PAIRS)('%s on %s has at least 4.5:1', (fg, bg) => {
    expect(contrast(get(fg), get(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)('%s on %s has at least 3:1', (fg, bg) => {
    expect(contrast(get(fg), get(bg))).toBeGreaterThanOrEqual(3);
  });
});
