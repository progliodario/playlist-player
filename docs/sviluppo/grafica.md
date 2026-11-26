# Grafica

**In breve**: tema artistico "**Notturno**" (scuro, predefinito) con variante "**Alba**" (chiara).
Tutti i colori sono token in `src/styles/tokens.css`; le illustrazioni sono SVG generati nel codice
in `src/ui/art/`. Nessuna immagine o libreria grafica esterna.

## Idea

Un concerto sotto il cielo notturno: aurora che si muove lentamente, stelle, grana da pellicola,
neon magenta/oro/viola, superfici di vetro smerigliato, dischi in vinile che girano. Di giorno
("Alba") lo stesso mondo con un cielo pesca e lilla e il sole al posto della luna.

| Elemento                       | Dove                                                      |
| ------------------------------ | --------------------------------------------------------- |
| Sfondo (aurora, stelle, grana) | `.app__backdrop` in `src/styles/layout.css`               |
| Cielo con città e onde sonore  | `src/ui/art/NightSkyHero.tsx` (Libreria)                  |
| Disco in vinile                | `src/ui/art/Vinyl.tsx` (card, playlist, lettore, sidebar) |
| Musicassetta                   | `src/ui/art/CassetteArt.tsx` (stati vuoti)                |
| Barre equalizzatore            | `src/ui/art/EqualizerBars.tsx`                            |
| Colore per playlist            | `hueFromString(key)` → `--hue` (`src/ui/art/art-math.ts`) |
| Icona dell'app                 | `scripts/generate-icons.ts` → `npm run icons`             |

Card: le playlist musicali sono una **custodia di disco** con il vinile che spunta (e scorre fuori
al passaggio del mouse); quelle video hanno una **cornice a pellicola**.

## Token (`src/styles/tokens.css`)

- Superfici: `--bg`, `--surface`, `--surface-2`, `--surface-3` (opache, testate per il contrasto),
  `--surface-glass`, `--surface-raised` (traslucide).
- Testo: `--text`, `--text-muted`, `--text-faint`.
- Accenti: `--accent`, `--accent-strong` (accento usato come testo), `--accent-ink` (testo
  sopra l'accento), `--violet`, `--gold`, `--teal`, `--gradient-brand`, `--focus`.
- Illustrazioni: `--art-*`, `--vinyl-*`, `--aurora-*`, `--star`.
- Tipografia: `--font-display` (**Fraunces**, titoli), `--font-ui` (**Manrope**, testo), scala
  `--text-xs` … `--text-hero` in rem.
- Spazi `--space-1…7`, raggi `--radius-s…xl`, `--touch` (44px).

Font self-hosted da npm (`@fontsource-variable/*`, importati in `src/main.tsx`): nessuna richiesta a
servizi esterni, disponibili offline.

## Fogli di stile (in ordine di caricamento)

| File             | Contenuto                                                                 |
| ---------------- | ------------------------------------------------------------------------- |
| `tokens.css`     | Variabili dei due temi                                                    |
| `base.css`       | Reset, tipografia, pulsanti, campi, cursori, interruttori                 |
| `layout.css`     | Griglia dell'app, sfondo, sidebar, barra in basso, notifiche              |
| `components.css` | Miniature, card, righe brano, gruppi radio, dialog, stati                 |
| `art.css`        | Colori e animazioni delle illustrazioni                                   |
| `player.css`     | Pannello del lettore e comandi                                            |
| `views.css`      | Pagine (Libreria, Playlist, In riproduzione, Impostazioni)                |
| `a11y.css`       | Focus, skip link, movimento/trasparenza/contrasto ridotti, colori forzati |

## Regole

1. **Mai colori scritti a mano** fuori da `tokens.css` (eccezione: nero del riquadro video).
2. Ogni nuova coppia testo/sfondo va aggiunta a `src/styles/contrast.node.test.ts`.
3. Ogni animazione deve fermarsi con `prefers-reduced-motion` (lo fa già la regola globale in
   `a11y.css`: non sovrascriverla con `!important`).
4. Le illustrazioni sono decorative: `aria-hidden="true"` e niente testo dentro.
5. Le classi seguono lo stile BEM (`.playlist-card__title`, `--music`, `.is-active`).
6. Un solo breakpoint desktop: **1024px** (più un aggiustamento per telefoni < 360px).

## Aggiungere un'illustrazione

1. Crea `src/ui/art/NomeArt.tsx` con un `<svg aria-hidden="true" focusable="false">`, colori presi
   da classi CSS o da `var(--...)`; se usi `id` per gradienti, rendili unici con `useId()`.
2. Colori e animazioni in `src/styles/art.css`.
3. Se serve casualità, usa `seededRandom()` (stesso disegno a ogni render).
