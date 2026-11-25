/**
 * Generates every app icon from ONE drawing (defined below in iconSvg()):
 *   public/favicon.svg                       browser tab + in-app logo
 *   public/icons/icon-192.png, icon-512.png  PWA icons (rounded square)
 *   public/icons/icon-maskable-512.png       PWA maskable icon (full bleed)
 *   public/icons/apple-touch-icon.png        iOS home screen
 *   android/app/src/main/res/mipmap-* /ic_launcher*.png   Android launcher icons
 *   android/app/src/main/res/drawable/splash.png          Android splash image
 *
 * Usage: npm run icons   (commit the results; they are not generated in CI)
 * To change the logo: edit iconSvg() and run the command again.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const GRADIENT_START = '#8b6cff';
const GRADIENT_END = '#ff5c8a';

interface IconOptions {
  /** Corner radius in a 512 box; 0 = full square (maskable / Android adaptive). */
  radius: number;
  /** Scale of the white glyph (1 = default, <1 adds padding for safe zones). */
  glyphScale: number;
  /** Transparent background (only the glyph, used for the splash image). */
  transparent?: boolean;
}

function iconSvg({ radius, glyphScale, transparent = false }: IconOptions): string {
  const glyph = `
    <rect x="112" y="120" width="230" height="36" rx="18"/>
    <rect x="112" y="202" width="230" height="36" rx="18"/>
    <rect x="112" y="284" width="130" height="36" rx="18"/>
    <path d="M282 270 L402 340 L282 410 Z" stroke="#fff" stroke-width="16" stroke-linejoin="round"/>`;
  const offset = (512 * (1 - glyphScale)) / 2;
  const background = transparent
    ? ''
    : `<rect width="512" height="512" rx="${radius}" fill="url(#g)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${GRADIENT_START}"/><stop offset="1" stop-color="${GRADIENT_END}"/>
  </linearGradient></defs>
  ${background}
  <g fill="#fff" transform="translate(${offset} ${offset}) scale(${glyphScale})">${glyph}</g>
</svg>
`;
}

async function png(svg: string, size: number, file: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
  console.log(`[icons] ${file}`);
}

async function main(): Promise<void> {
  const rounded = iconSvg({ radius: 120, glyphScale: 1 });
  const fullBleed = iconSvg({ radius: 0, glyphScale: 0.8 });

  await mkdir('public/icons', { recursive: true });
  await writeFile('public/favicon.svg', rounded);
  console.log('[icons] public/favicon.svg');
  await png(rounded, 192, 'public/icons/icon-192.png');
  await png(rounded, 512, 'public/icons/icon-512.png');
  await png(fullBleed, 512, 'public/icons/icon-maskable-512.png');
  await png(iconSvg({ radius: 0, glyphScale: 0.9 }), 180, 'public/icons/apple-touch-icon.png');

  const res = 'android/app/src/main/res';
  const densities = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [density, size] of Object.entries(densities)) {
    await png(
      iconSvg({ radius: 0, glyphScale: 0.9 }),
      size,
      `${res}/mipmap-${density}/ic_launcher.png`,
    );
    await png(
      iconSvg({ radius: 256, glyphScale: 0.9 }),
      size,
      `${res}/mipmap-${density}/ic_launcher_round.png`,
    );
  }
  await png(iconSvg({ radius: 120, glyphScale: 1 }), 288, `${res}/drawable/splash.png`);
}

main().catch((error: unknown) => {
  console.error('[icons] FAILED:', error);
  process.exitCode = 1;
});
