/**
 * Generates every app icon from ONE drawing (defined below in iconSvg()):
 *   public/favicon.svg                       browser tab + in-app logo
 *   public/icons/icon-192.png, icon-512.png  PWA icons (rounded square)
 *   public/icons/icon-maskable-512.png       PWA maskable icon (full bleed)
 *   public/icons/apple-touch-icon.png        iOS home screen
 *   android/app/src/main/res/mipmap-* /ic_launcher*.png   Android launcher icons
 *   android/app/src/main/res/drawable/splash.png          Android splash image
 *
 * The drawing ("Notturno" theme, docs/sviluppo/grafica.md): a vinyl record with a
 * gradient label and a play sign, under a crescent moon and stars, on a night-sky
 * gradient from indigo to magenta.
 *
 * Usage: npm run icons   (commit the results; they are not generated in CI)
 * To change the logo: edit iconSvg() and run the command again.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

interface IconOptions {
  /** Corner radius in a 512 box; 0 = full square (maskable / Android adaptive). */
  radius: number;
  /** Scale of the drawing (1 = default, <1 adds padding for safe zones). */
  glyphScale: number;
}

function iconSvg({ radius, glyphScale }: IconOptions): string {
  const offset = (512 * (1 - glyphScale)) / 2;
  const grooves = [150, 136, 122, 108, 94]
    .map(
      (r, i) =>
        `<circle cx="276" cy="288" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="${i % 2 ? 0.07 : 0.13}" stroke-width="3"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1a0f4f"/>
      <stop offset="0.55" stop-color="#5b1f9e"/>
      <stop offset="1" stop-color="#ff4f9a"/>
    </linearGradient>
    <linearGradient id="label" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9b7bff"/>
      <stop offset="0.5" stop-color="#ff6aa8"/>
      <stop offset="1" stop-color="#ffc65c"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffe9b0" stop-opacity="0.6"/>
      <stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/>
    </radialGradient>
    <mask id="crescent">
      <rect width="512" height="512" fill="#fff"/>
      <circle cx="146" cy="104" r="40" fill="#000"/>
    </mask>
  </defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#sky)"/>
  <g transform="translate(${offset} ${offset}) scale(${glyphScale})">
    <circle cx="128" cy="124" r="96" fill="url(#glow)"/>
    <circle cx="124" cy="124" r="46" fill="#ffe9b0" mask="url(#crescent)"/>
    <circle cx="392" cy="96" r="6" fill="#fff8e6"/>
    <circle cx="440" cy="160" r="4" fill="#fff8e6"/>
    <circle cx="214" cy="70" r="4" fill="#fff8e6"/>
    <circle cx="276" cy="288" r="166" fill="#0e0b18"/>
    ${grooves}
    <path d="M276 288 L380 160 A166 166 0 0 1 430 230 Z" fill="#ffffff" fill-opacity="0.08"/>
    <circle cx="276" cy="288" r="66" fill="url(#label)"/>
    <path d="M256 254 L310 288 L256 322 Z" fill="#1b0b24"/>
  </g>
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
