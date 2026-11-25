# AGENTS.md — guida per chi modifica questo progetto

Questo file è il punto di partenza per **sviluppatori e agenti AI** (Claude, Copilot, Codex…).
Leggilo tutto prima di cambiare il codice: contiene la mappa del progetto, i comandi, le regole
da non rompere e le ricette per le modifiche più comuni.

## In una frase

Web app React + TypeScript (Vite) installabile come PWA, pubblicata su GitHub Pages, con un
guscio Android (Trusted Web Activity) che la apre a schermo intero. Mostra playlist YouTube da
tre sorgenti e le riproduce con il player ufficiale di YouTube (IFrame API).

## Comandi

| Comando           | Cosa fa                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| `npm install`     | Installa le dipendenze (Node ≥ 24, vedi `.nvmrc`)                        |
| `npm run dev`     | Server di sviluppo su `http://localhost:5173/playlist-player/`           |
| `npm run catalog` | Genera `public/catalog/` dal canale YouTube (serve `yt-dlp`, vedi sotto) |
| `npm run check`   | **Da eseguire prima di ogni commit**: tipi + lint + Prettier + test      |
| `npm run build`   | Typecheck + build di produzione in `dist/`                               |
| `npm run format`  | Formatta tutto con Prettier                                              |
| `npm test`        | Solo i test (Vitest)                                                     |
| `npm run icons`   | Rigenera tutte le icone (web + Android) da `scripts/generate-icons.ts`   |

`yt-dlp` per `npm run catalog`: `pipx install yt-dlp` (o `pip install yt-dlp`). Se non è nel
PATH: variabile d'ambiente `YT_DLP` con il comando, es. `YT_DLP="python -m yt_dlp"`.
Senza catalogo l'app funziona lo stesso: la sezione del canale mostra un errore con "Riprova".

## Mappa del progetto

```
app.config.json          ← IDENTITÀ DEL PROGETTO: nome, URL, canale, client OAuth, versione Android
src/
  main.tsx               entry point (registra PWA, monta <App/>)
  app/                   guscio applicativo
    App.tsx              layout + routing
    router.ts            router a hash (#/, #/playlist/<key>, #/now, #/settings)
    actions.ts           azioni utente che coinvolgono più store (play playlist, aggiungi link…)
    effects.ts           effetti globali (tema, titolo finestra, scorciatoie, caricamento libreria)
    pwa.ts               service worker + prompt "Installa app"
  config/app-config.ts   accesso tipizzato a app.config.json + costanti di build
  domain/                LOGICA PURA (niente React/DOM/rete) + test *.test.ts
    types.ts             Track, Playlist, PlaylistSummary, SourceKind, chiavi playlist
    queue.ts             coda di riproduzione (ordine, casuale, ripeti, avanti/indietro)
    classify.ts          euristica musica/video
    youtube-urls.ts      parsing link YouTube, URL miniature
    format.ts            durate, nomi artista, ricerca senza accenti
  sources/               DA DOVE ARRIVANO LE PLAYLIST (vedi docs/DATA-SOURCES.md)
    types.ts             interfaccia PlaylistSource
    registry.ts          elenco sorgenti e ordine delle sezioni
    catalog/             playlist pubbliche del canale (JSON statici generati in CI)
    account/             account Google (OAuth GIS + YouTube Data API v3)
    manual/              playlist aggiunte per link (oEmbed + player temporaneo)
  player/                RIPRODUZIONE
    youtube-iframe-api.ts  caricamento IFrame API, costanti stati/errori
    youtube-player-engine.ts  l'unico player YouTube dell'app (iframe)
    player-store.ts      stato di riproduzione + comandi (zustand), collega coda ↔ player
  state/                 store zustand: settings (persistito), library, toast, chiavi storage
  i18n/                  testi UI: it.ts (fonte di verità), en.ts, index.ts (useStrings)
  ui/                    componenti React
    components/          mattoncini riutilizzabili (card, righe brano, dialog…)
    player/              pannello "In riproduzione", controlli, barra, coda
    layout/              sidebar desktop + barra in basso telefono
    views/               pagine: Libreria, Playlist, In riproduzione, Impostazioni
    icons.tsx            icone SVG disegnate a mano
  styles/                CSS globale: tokens.css (colori/spazi), base, layout, components, player, views
scripts/
  build-catalog.ts       genera public/catalog/ con yt-dlp (usato dal deploy giornaliero)
  generate-icons.ts      genera favicon, icone PWA e icone Android da un unico disegno
android/                 progetto Gradle della TWA (nessuna logica: apre il sito)
public/                  file statici (icone, favicon); public/catalog/ è generato e ignorato da git
docs/                    documentazione (in italiano)
.github/workflows/       ci.yml (verifiche), deploy.yml (Pages + catalogo), android.yml (APK)
```

## Regole da non rompere (invarianti)

1. **Player YouTube sempre visibile e ≥ 200×200 px mentre riproduce.** Mai nasconderlo, coprirlo
   o usarlo come "solo audio". Mai scaricare o mettere in cache i media. → `docs/YOUTUBE-POLICIES.md`
2. **`<NowPlayingPanel/>` e `<PlayerViewport/>` si montano una sola volta** e non vanno mai
   smontati o spostati nel DOM (l'iframe si ricaricherebbe e la musica si fermerebbe). Il layout
   desktop/telefono cambia **solo via CSS**.
3. **`src/domain/` resta puro**: niente React, DOM, `fetch`, `localStorage`. Solo sintassi
   TypeScript "erasable" (niente `enum`, `namespace`, parameter properties) perché
   `scripts/build-catalog.ts` importa questi file direttamente con Node.
4. **Import con estensione `.ts`/`.tsx`** (`import { x } from './file.ts'`), richiesto da Node per gli script.
5. **L'identità del progetto vive solo in `app.config.json`** (nome, URL, canale, versione Android,
   client OAuth). Vite, script e Gradle la leggono da lì: non duplicarla altrove.
6. **Ogni testo visibile passa da `src/i18n/`**: aggiungi la chiave in `it.ts` e poi in `en.ts`
   (TypeScript segnala le chiavi mancanti).
7. **Chiavi `localStorage` solo in `src/state/storage-keys.ts`**. Se cambi la forma dei dati
   persistiti, aumenta `version` nello store e scrivi una `migrate`.
8. **Niente segreti nel repository.** Il client ID OAuth non è un segreto; le chiavi di firma
   Android stanno nei GitHub Secrets.
9. **`npm run check` deve passare** prima di ogni commit (la CI lo verifica).

## Convenzioni

- Codice, nomi e commenti nel codice: **inglese**. Documentazione e testi UI predefiniti: **italiano**.
- TypeScript `strict` + `noUncheckedIndexedAccess`; niente `any`.
- Stato globale: **zustand** (uno store per area). Componenti: funzioni React, niente classi.
- CSS: file globali in `src/styles/`, classi in stile BEM (`.playlist-card__title`,
  modificatori `--music`, stati `.is-active`). Colori e spazi **solo** tramite variabili di
  `tokens.css`. Breakpoint unico desktop: **1024px**.
- Formattazione: Prettier (`.prettierrc.json`), 100 colonne, apici singoli.
- Commit: messaggi brevi all'imperativo in inglese (es. `Add repeat-one icon`), aggiorna
  `CHANGELOG.md` per i cambiamenti visibili.

## Ricette

**Cambiare canale YouTube, nome app o URL** → modifica `app.config.json`, poi `npm run icons`
solo se cambi il logo. Se cambi `basePath`/`publicUrl` (es. nuovo nome repository) aggiorna anche
le origini autorizzate del client OAuth (docs/GOOGLE-OAUTH-SETUP.md).

**Includere/escludere playlist dal catalogo o forzarne il tipo** → `app.config.json` →
`youtube.extraPlaylistIds`, `youtube.excludedPlaylistIds`, `youtube.kindOverrides`
(`{"PL...": "video"}`).

**Attivare l'accesso Google** → `docs/GOOGLE-OAUTH-SETUP.md`, poi metti il client ID in
`app.config.json` → `google.oauthClientId`.

**Aggiungere un testo all'interfaccia** → `src/i18n/it.ts` + `src/i18n/en.ts`, poi
`const t = useStrings()` e `t.sezione.chiave` nel componente.

**Aggiungere una pagina** → estendi `Route`, `parseHash()` e `routeHref()` in
`src/app/router.ts` (+ test in `router.test.ts`), crea `src/ui/views/NomeView.tsx`, aggiungila in
`CurrentView` dentro `src/app/App.tsx` e, se serve, nella navigazione `src/ui/layout/Navigation.tsx`.

**Aggiungere una sorgente di playlist** → vedi `src/sources/types.ts` (4 passi) e
`docs/DATA-SOURCES.md`.

**Cambiare la logica musica/video** → `src/domain/classify.ts` (costanti in alto) + test in
`classify.test.ts`. Il catalogo usa la stessa funzione al prossimo deploy.

**Cambiare colori/tema** → `src/styles/tokens.css` (tema scuro in `:root`, chiaro in
`[data-theme='light']`).

**Cambiare il logo** → `iconSvg()` in `scripts/generate-icons.ts`, poi `npm run icons` e committa
i PNG generati.

**Nuova versione / APK** → `docs/DEPLOY.md` § Rilasciare una versione.

## Verifica manuale dopo una modifica all'interfaccia

1. `npm run dev` e apri `http://localhost:5173/playlist-player/`.
2. Libreria: ricerca, filtro Musica/Video, ordinamento.
3. Apri una playlist → Riproduci → la musica parte, il tempo avanza, Successivo funziona.
4. Ricarica la pagina → la coda torna, premendo play riprende dal punto salvato.
5. Restringi la finestra sotto 1024px → layout telefono (player in alto, barra in basso).
6. Tema chiaro e scuro (Impostazioni).

## Dove trovare cosa (domande frequenti)

- _Perché hash router e non history API?_ GitHub Pages non riscrive gli URL. → `docs/DECISIONS.md`
- _Perché TypeScript 6 e non 7?_ `typescript-eslint` non supporta ancora TS 7. → `docs/DECISIONS.md`
- _Perché l'APK è una TWA e non una WebView?_ Google blocca il login nelle WebView e il player
  YouTube richiede un'origine web vera. → `docs/DECISIONS.md`
- _Il catalogo non si aggiorna?_ Guarda l'ultimo run di "Deploy to GitHub Pages" nella tab Actions.
