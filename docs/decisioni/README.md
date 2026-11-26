# Registro delle decisioni

Perché il progetto è fatto così. Formato: contesto → decisione → conseguenze.
Aggiungi una voce quando prendi una decisione che un futuro manutentore potrebbe mettere in dubbio.

## D1 — Web app (PWA) + guscio Android TWA, invece di app native o Electron

- **Contesto**: serve un'app per Windows e Android, facile da mantenere da una persona o da un'AI.
  Il player YouTube incorporato richiede un'origine web vera (con header Referer, altrimenti
  errore 153) e Google **blocca il login OAuth** nelle WebView e in Electron.
- **Decisione**: un'unica web app React installabile come PWA (Windows tramite Edge/Chrome),
  pubblicata su GitHub Pages, e per Android una Trusted Web Activity che la apre in Chrome.
- **Conseguenze**: un solo codice; aggiornamenti istantanei su tutti i dispositivi; nessuna
  dipendenza da store. Su Android serve Chrome. Niente riproduzione a schermo spento.

## D2 — Catalogo pubblico generato in CI con yt-dlp

- **Contesto**: l'utente non vuole configurare nulla; le API di YouTube richiedono una chiave o
  l'OAuth anche per le playlist pubbliche, e il browser non può leggere le pagine di YouTube (CORS).
- **Decisione**: un workflow giornaliero legge i metadati delle playlist pubbliche del canale con
  yt-dlp e li pubblica come JSON statici insieme al sito.
- **Conseguenze**: funziona senza login e senza chiavi. Le playlist private richiedono la sorgente
  "account". Se YouTube blocca la CI si riusa il catalogo precedente.

## D3 — Account Google opzionale, senza backend

- **Contesto**: per playlist private serve OAuth; un backend costerebbe e andrebbe mantenuto.
- **Decisione**: Google Identity Services token client (flusso implicito) direttamente nel
  browser, scope `youtube.readonly`. Client ID in `app.config.json` (non è un segreto).
- **Conseguenze**: il token dura un'ora, poi serve "Riconnetti". Richiede la configurazione una
  tantum descritta in GOOGLE-OAUTH-SETUP.md.

## D4 — Router a hash

- **Decisione**: URL come `#/playlist/<key>`.
- **Perché**: GitHub Pages non riscrive gli URL verso `index.html`; con l'hash i link profondi e
  il pulsante indietro funzionano ovunque, anche nella TWA.

## D5 — Un solo iframe YouTube, layout solo CSS

- **Decisione**: `<NowPlayingPanel/>` è montato una sola volta e il layout telefono/desktop
  cambia solo con CSS grid.
- **Perché**: spostare o ricreare un iframe lo ricarica e interrompe la musica.

## D6 — Zustand per lo stato, niente framework di routing/UI

- **Decisione**: React + zustand + CSS globale con token; nessuna libreria di componenti o router.
- **Perché**: poche dipendenze = meno aggiornamenti che rompono; codice leggibile per umani e AI.

## D7 — TypeScript 6.0 invece di 7

- **Contesto** (novembre 2026): TypeScript 7 (compilatore nativo) è uscito, ma `typescript-eslint`
  supporta solo TypeScript `< 6.1`.
- **Decisione**: `typescript ~6.0.3`; Dependabot ignora gli aggiornamenti major di TypeScript.
- **Quando rivedere**: quando `typescript-eslint` dichiara il supporto a TS 7 (controlla
  `npm view typescript-eslint peerDependencies`).

## D8 — Script in TypeScript eseguiti direttamente da Node

- **Decisione**: `scripts/*.ts` girano con `node script.ts` (type stripping nativo di Node ≥ 24)
  e importano `src/domain/` senza build.
- **Conseguenze**: in `src/domain/` e nei file importati dagli script solo sintassi "erasable"
  (`erasableSyntaxOnly` nel tsconfig lo verifica) e import con estensione `.ts`.

## D9 — Android Gradle senza wrapper

- **Decisione**: nessun `gradlew`/`gradle-wrapper.jar` nel repository; la CI usa
  `gradle/actions/setup-gradle` con una versione fissata.
- **Perché**: evita file binari nel repository. Android Studio genera il wrapper se serve in locale.

## D10 — Android Gradle Plugin 8.x fissato

- **Contesto** (novembre 2026): esiste AGP 9, che richiede Gradle 9 e cambia parte del DSL.
- **Decisione**: AGP 8.13.2 + Gradle 8.14.3, versioni verificate in CI. Dependabot ignora i
  major dell'AGP e di `@types/node` (che deve seguire la versione di Node in `.nvmrc`).
- **Per aggiornare**: cambia insieme `android/build.gradle` e `gradle-version` in
  `.github/workflows/android.yml`, apri una PR e controlla che il workflow "Android APK" passi.
