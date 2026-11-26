# AGENTS.md — guida per chi modifica questo progetto

Punto di partenza per **sviluppatori e agenti AI** (Claude, Copilot, Codex…). Leggilo tutto prima
di cambiare il codice: mappa del progetto, comandi, regole da non rompere, ricette.
Indice completo della documentazione: [docs/README.md](docs/README.md).

## In una frase

Web app React + TypeScript (Vite) installabile come PWA, pubblicata su GitHub Pages, con un guscio
Android (Trusted Web Activity). Mostra playlist YouTube da tre sorgenti e le riproduce con il player
ufficiale di YouTube. Tema illustrato "Notturno"/"Alba". Obiettivo di accessibilità: WCAG 2.2 AA.

## Comandi

| Comando           | Cosa fa                                                                               |
| ----------------- | ------------------------------------------------------------------------------------- |
| `npm install`     | Installa le dipendenze (Node ≥ 24, vedi `.nvmrc`)                                     |
| `npm run dev`     | Server di sviluppo su `http://localhost:5173/playlist-player/`                        |
| `npm run check`   | **Prima di ogni commit**: tipi + lint (anche accessibilità) + Prettier + tutti i test |
| `npm run build`   | Typecheck + build di produzione in `dist/`                                            |
| `npm run format`  | Formatta tutto con Prettier                                                           |
| `npm test`        | Solo i test (Vitest): dominio, contrasti, axe-core sulle pagine                       |
| `npm run catalog` | Genera `public/catalog/` dal canale (serve `yt-dlp`)                                  |
| `npm run icons`   | Rigenera icone web e Android da `scripts/generate-icons.ts`                           |

`yt-dlp`: `pipx install yt-dlp` (o `pip install yt-dlp`); se non è nel PATH usa la variabile
`YT_DLP` (es. `YT_DLP="python -m yt_dlp"`). Senza catalogo l'app funziona: la sezione del canale
mostra un errore con "Riprova".

## Mappa del progetto

```
app.config.json            ← IDENTITÀ: nome, URL, canale, client OAuth, versione Android, colore
index.html                 applica tema e lingua salvati prima del primo disegno
src/
  main.tsx                 entry point: font, CSS in ordine, PWA, <App/>
  app/                     guscio: App.tsx (layout+routing), router.ts, actions.ts, effects.ts, pwa.ts
  config/app-config.ts     accesso tipizzato a app.config.json
  domain/                  LOGICA PURA + test: tipi, coda, musica/video, URL YouTube, formati
  sources/                 DA DOVE ARRIVANO LE PLAYLIST: catalog/, account/, manual/, registry.ts
  player/                  RIPRODUZIONE: IFrame API, engine (l'unico iframe), store (coda ↔ engine)
  state/                   store zustand: settings, library, toast, announcer, chiavi storage
  i18n/                    testi: it.ts (fonte di verità), en.ts, index.ts (useStrings, formati data)
  ui/
    a11y/                  SkipLink, LiveAnnouncer
    art/                   illustrazioni SVG: NightSkyHero, Vinyl, CassetteArt, EqualizerBars, art-math
    components/            mattoncini: PlaylistCard, TrackRow, SegmentedControl, Toasts, dialog…
    layout/                Sidebar (desktop) e BottomNav (telefono)
    player/                pannello del lettore, comandi, barra, coda, riquadro video
    views/                 pagine: Library, Playlist, NowPlaying, Settings
    a11y.test.tsx          axe-core su tutte le pagine
  styles/                  tokens.css (colori!), base, layout, components, art, player, views, a11y
                           + contrast.node.test.ts (contrasti WCAG dei token)
scripts/                   build-catalog.ts, catalog-changed.ts, generate-icons.ts
android/                   progetto Gradle della TWA (nessuna logica)
public/                    icone e favicon; public/catalog/ è generato e ignorato da git
docs/                      utente/, sviluppo/, decisioni/ (in italiano)
.github/workflows/         ci.yml, deploy.yml (ogni 15 min + push), android.yml
```

## Regole da non rompere (invarianti)

1. **Regole YouTube**: player ufficiale, sempre visibile e ≥ 200×200 px mentre suona, nulla sopra
   l'iframe, **niente blocco delle pubblicità, niente riproduzione in background**, niente
   download. Anche se richiesto: proponi le alternative in
   [docs/sviluppo/regole-youtube.md](docs/sviluppo/regole-youtube.md).
2. **`<NowPlayingPanel/>` e `<PlayerViewport/>` si montano una sola volta**: il layout cambia solo
   con il CSS (spostare l'iframe ferma la musica).
3. **Il pulsante play/pausa segue `playIntent`**, non `status` (YouTube non manda eventi durante
   le pubblicità). Vedi [docs/sviluppo/lettore.md](docs/sviluppo/lettore.md).
4. **`src/domain/` resta puro** (niente React/DOM/fetch/storage), solo sintassi "erasable", import
   con estensione `.ts`: gli script Node lo importano direttamente.
5. **Identità solo in `app.config.json`**; Vite, script e Gradle la leggono da lì.
6. **Testi solo in `src/i18n/`** (anche le etichette per lettori di schermo): prima `it.ts`, poi
   `en.ts` (TypeScript segnala le chiavi mancanti).
7. **Colori solo in `src/styles/tokens.css`**; ogni nuova coppia testo/sfondo nel test dei contrasti.
8. **Accessibilità**: segui le 12 regole di [docs/sviluppo/accessibilita.md](docs/sviluppo/accessibilita.md)
   (nomi accessibili, un h1 con `tabIndex={-1}` per pagina, `SegmentedControl` per le opzioni,
   `announce()` per i messaggi, `ExternalLink` per i link esterni, animazioni fermabili).
9. **Chiavi `localStorage` solo in `src/state/storage-keys.ts`**; se cambi la forma dei dati
   persistiti aumenta `version` e scrivi una `migrate`.
10. **Formato del catalogo** = `src/sources/catalog/catalog-schema.ts`; se cambia, aumenta
    `CATALOG_SCHEMA_VERSION` e aggiorna script e sorgente insieme.
11. **Niente segreti nel repository** (le chiavi Android stanno nei GitHub Secrets).
12. **`npm run check` deve passare** (la CI lo verifica, anche su ogni PR).

## Convenzioni

- Codice, nomi e commenti nel codice: **inglese**. Documentazione e testi predefiniti: **italiano**.
- TypeScript `strict` + `noUncheckedIndexedAccess`; niente `any`.
- Stato: zustand, uno store per area. Componenti: funzioni React. Azioni che toccano più store:
  `src/app/actions.ts`.
- CSS: file globali per area, classi BEM (`.playlist-card__title`, `--music`, `.is-active`),
  un breakpoint desktop **1024px**. Regole grafiche: [docs/sviluppo/grafica.md](docs/sviluppo/grafica.md).
- Test: accanto al file (`x.test.ts`); se usano API Node `x.node.test.ts`.
- Prettier: 100 colonne, apici singoli. Commit brevi all'imperativo in inglese; aggiorna
  `CHANGELOG.md` per i cambiamenti visibili e la documentazione nello stesso commit.

## Ricette

| Voglio…                                         | Cosa fare                                                                                                                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cambiare canale, nome app o URL                 | `app.config.json` (se cambi URL aggiorna le origini OAuth: `docs/sviluppo/account-google.md`)                                                                                                                             |
| Includere/escludere playlist o forzarne il tipo | `app.config.json → youtube.extraPlaylistIds / excludedPlaylistIds / kindOverrides`                                                                                                                                        |
| Accesso Google (già attivo): altri account, URL | `docs/sviluppo/account-google.md` § Stato attuale (utenti di test, origini del client OAuth)                                                                                                                              |
| Cambiare chiave di firma o package Android      | aggiorna `.well-known/assetlinks.json` nel repository `progliodario.github.io` (`docs/sviluppo/android.md`)                                                                                                               |
| Aggiungere un testo                             | `src/i18n/it.ts` + `en.ts`, poi `const t = useStrings()` → `t.sezione.chiave`                                                                                                                                             |
| Aggiungere una pagina                           | `Route`/`parseHash`/`routeHref` in `router.ts` (+test), `ui/views/NomeView.tsx` con `h1 tabIndex={-1}`, `CurrentView` e `pageTitleOf` in `App.tsx`, navigazione in `ui/layout/Navigation.tsx`, caso in `ui/a11y.test.tsx` |
| Aggiungere una sorgente di playlist             | i 4 passi in `src/sources/types.ts` + `docs/sviluppo/sorgenti-dati.md`                                                                                                                                                    |
| Cambiare la logica musica/video                 | costanti in `src/domain/classify.ts` + test                                                                                                                                                                               |
| Cambiare colori o tema                          | `src/styles/tokens.css` (scuro `:root`, chiaro `[data-theme='light']`), poi `npm test`                                                                                                                                    |
| Aggiungere un'illustrazione                     | `docs/sviluppo/grafica.md` § Aggiungere un'illustrazione                                                                                                                                                                  |
| Cambiare il logo                                | `iconSvg()` in `scripts/generate-icons.ts`, `npm run icons`, committa i PNG                                                                                                                                               |
| Cambiare la frequenza di aggiornamento          | `cron` in `.github/workflows/deploy.yml`, `CATALOG_POLL_MS` in `src/app/effects.ts`                                                                                                                                       |
| Rilasciare una versione / APK                   | `docs/sviluppo/deploy-e-rilasci.md` § Rilasciare una versione                                                                                                                                                             |

## Verifica manuale dopo una modifica all'interfaccia

1. `npm run dev` → `http://localhost:5173/playlist-player/`.
2. Libreria: ricerca, filtro, ordinamento; apri una playlist → Riproduci → il tempo avanza.
3. Ricarica → la coda torna, play riprende dal punto salvato.
4. Finestra < 1024px e a 320px: layout telefono, nessuno scorrimento orizzontale.
5. Temi Notturno e Alba; solo tastiera (Tab, frecce, Esc).

## Perché è fatto così

Ogni scelta discutibile ha un file in [docs/decisioni/](docs/decisioni/README.md) (es. hash
router, TypeScript 6, TWA invece di WebView, niente blocco pubblicità, catalogo ogni 15 minuti).
