/**
 * Illustrated banner of the library: a night sky over a city, with a glowing sound
 * wave, floating notes, stars and a crescent moon (a dawn sky with the sun in the light
 * theme). Purely decorative: hidden from assistive technology.
 *
 * Colors come from CSS variables (--art-*) defined in src/styles/tokens.css, so the same
 * drawing adapts to both themes. Geometry is generated once, deterministically.
 */
import { seededRandom, smoothPath } from './art-math.ts';

const WIDTH = 1200;
const HEIGHT = 380;
const HORIZON = 300;

interface Star {
  x: number;
  y: number;
  r: number;
  delay: number;
}

interface Building {
  x: number;
  width: number;
  height: number;
  windows: { x: number; y: number; lit: boolean }[];
}

const geometry = buildGeometry();

function buildGeometry() {
  const random = seededRandom(20261126);

  const stars: Star[] = Array.from({ length: 90 }, () => ({
    x: random() * WIDTH,
    y: random() * (HORIZON - 120),
    r: 0.6 + random() * 1.4,
    delay: random() * 6,
  }));

  const farMountains = smoothPath([
    [0, 250],
    ...Array.from({ length: 21 }, (_, i): [number, number] => [
      i * 60,
      232 + Math.sin(i * 1.3) * 22 + random() * 18,
    ]),
    [WIDTH, 250],
  ]);

  const buildings: Building[] = [];
  for (let x = -10; x < WIDTH;) {
    const width = 26 + Math.floor(random() * 46);
    const height = 34 + Math.floor(random() * (random() > 0.85 ? 130 : 80));
    const windows: Building['windows'] = [];
    for (let wy = HORIZON - height + 10; wy < HORIZON - 8; wy += 11) {
      for (let wx = x + 6; wx < x + width - 6; wx += 9) {
        windows.push({ x: wx, y: wy, lit: random() > 0.72 });
      }
    }
    buildings.push({ x, width, height, windows });
    x += width + 2 + Math.floor(random() * 6);
  }

  // Sound wave: a sine whose amplitude swells in the middle of the sky.
  const wave = (phase: number, amplitude: number) =>
    smoothPath(
      Array.from({ length: 81 }, (_, i): [number, number] => {
        const x = (i / 80) * WIDTH;
        const envelope = Math.sin((i / 80) * Math.PI) ** 1.5;
        return [x, 150 + Math.sin(i * 0.55 + phase) * amplitude * envelope];
      }),
    );

  const hills = smoothPath([
    [0, HEIGHT],
    [0, 318],
    [180, 300],
    [360, 330],
    [560, 306],
    [760, 336],
    [960, 310],
    [1100, 326],
    [WIDTH, 312],
    [WIDTH, HEIGHT],
  ]);

  const notes = [
    { x: 250, y: 96, scale: 1.1, delay: 0 },
    { x: 430, y: 70, scale: 0.8, delay: 1.2 },
    { x: 640, y: 104, scale: 1.3, delay: 2.1 },
    { x: 820, y: 60, scale: 0.9, delay: 0.7 },
    { x: 1080, y: 200, scale: 0.75, delay: 1.7 },
  ];

  return {
    stars,
    farMountains: `${farMountains} Z`,
    buildings,
    waves: [wave(0, 46), wave(1.4, 30), wave(2.6, 18)],
    hills: `${hills} Z`,
    notes,
  };
}

export function NightSkyHero({ className = '' }: { className?: string }) {
  const { stars, farMountains, buildings, waves, hills, notes } = geometry;
  return (
    <svg
      className={`hero-art ${className}`}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--art-sky-top)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--art-sky-mid)' }} />
          <stop offset="1" style={{ stopColor: 'var(--art-sky-bottom)' }} />
        </linearGradient>
        <linearGradient id="hero-wave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--violet)', stopOpacity: 0 }} />
          <stop offset="0.25" style={{ stopColor: 'var(--violet)' }} />
          <stop offset="0.5" style={{ stopColor: 'var(--accent)' }} />
          <stop offset="0.75" style={{ stopColor: 'var(--gold)' }} />
          <stop offset="1" style={{ stopColor: 'var(--gold)', stopOpacity: 0 }} />
        </linearGradient>
        <radialGradient id="hero-glow">
          <stop offset="0" style={{ stopColor: 'var(--art-moon)', stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: 'var(--art-moon)', stopOpacity: 0 }} />
        </radialGradient>
        <filter id="hero-blur" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <mask id="hero-crescent">
          <rect width={WIDTH} height={HEIGHT} fill="#fff" />
          <circle cx="1002" cy="74" r="40" fill="#000" />
        </mask>
      </defs>

      <rect width={WIDTH} height={HEIGHT} fill="url(#hero-sky)" />

      <g className="hero-art__stars">
        {stars.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            style={{ animationDelay: `${star.delay}s` }}
          />
        ))}
      </g>

      <circle cx="985" cy="92" r="120" fill="url(#hero-glow)" />
      <g className="hero-art__moon">
        <circle cx="985" cy="92" r="46" mask="url(#hero-crescent)" />
      </g>
      <g className="hero-art__sun">
        <circle cx="985" cy="110" r="54" />
      </g>

      <path className="hero-art__mountains" d={farMountains} />

      <g className="hero-art__waves">
        <path d={waves[0]} stroke="url(#hero-wave)" strokeWidth="10" filter="url(#hero-blur)" />
        {waves.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="url(#hero-wave)"
            strokeWidth={3.5 - i}
            opacity={1 - i * 0.25}
          />
        ))}
      </g>

      <g className="hero-art__notes">
        {notes.map((note, i) => (
          <g
            key={i}
            transform={`translate(${note.x} ${note.y}) scale(${note.scale})`}
            style={{ animationDelay: `${note.delay}s` }}
          >
            <ellipse cx="0" cy="0" rx="7" ry="5.5" transform="rotate(-22)" />
            <rect x="5" y="-30" width="2.6" height="30" rx="1" />
            <path d="M7.6 -30 C18 -26 20 -16 14 -8 C16 -16 12 -20 7.6 -21 Z" />
          </g>
        ))}
      </g>

      <g className="hero-art__city">
        {buildings.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={HORIZON - b.height} width={b.width} height={b.height + 20} rx="2" />
            {b.windows.map((w, j) =>
              w.lit ? (
                <rect key={j} className="hero-art__window" x={w.x} y={w.y} width="3.5" height="5" />
              ) : null,
            )}
          </g>
        ))}
      </g>

      <path className="hero-art__hills" d={hills} />
    </svg>
  );
}
