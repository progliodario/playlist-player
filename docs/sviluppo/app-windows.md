# App Windows (`desktop/`)

**In breve**: un'app Electron che apre il sito pubblicato e aggiunge un lettore senza pubblicità
che continua con la finestra ridotta a icona. Gli stream li trova yt-dlp (scaricato e aggiornato
dall'app). Si pubblica con lo stesso tag `vX.Y.Z` dell'APK: il workflow **Windows app** allega
`playlist-player-setup.exe` alla Release.

## Come funziona

1. La finestra carica `app.config.json → publicUrl`: l'interfaccia è sempre quella del sito,
   aggiornata a ogni deploy (nessun aggiornamento dell'app necessario per l'interfaccia).
2. `preload.cjs` espone alla pagina `window.playlistPlayerDesktop` (contratto:
   `src/platform/desktop-bridge.ts`); la pagina allora usa il motore `stream`
   (`src/player/stream-player-engine.ts`).
3. Per ogni brano la pagina chiede `resolve(videoId)`: `main/ytdlp.cjs` esegue
   `yt-dlp -J` (client `visionos`, poi quelli predefiniti) e `main/formats.cjs` sceglie l'audio
   migliore e il manifest HLS.
4. L'audio arriva alla pagina da `ppstream://media/audio/<id>` (`main/stream-protocol.cjs`): l'app
   chiede a googlevideo.com i byte nel formato giusto (intestazione Range o `&range=`), con lo
   User-Agent giusto, e ricarica l'URL se è scaduto. Il video (playlist "video") usa HLS con hls.js;
   l'app aggiunge le intestazioni CORS alle risposte di googlevideo.com.
5. Tasti multimediali e riquadro multimediale di Windows: Media Session della pagina
   (`useMediaSessionEffect` in `src/app/effects.ts`).
6. Accesso con Google: nel browser predefinito (Google non lo permette dentro Electron), con ritorno
   su `http://127.0.0.1:43117/callback` (`main/google-sign-in.cjs`; l'indirizzo è registrato nel
   client OAuth, vedi [account-google.md](account-google.md)).

yt-dlp: scaricato al primo avvio in `%APPDATA%\Playlist Player\yt-dlp\`, verificato con lo
SHA-256 della release, aggiornato con `yt-dlp -U` una volta al giorno. I suoi calcoli JavaScript
usano il Node.js interno di Electron (`ELECTRON_RUN_AS_NODE`): non serve installare altro.

## File

| File                          | Contenuto                                                       |
| ----------------------------- | --------------------------------------------------------------- |
| `main/main.cjs`               | Avvio, finestra, sicurezza (navigazione, popup), CORS per HLS   |
| `main/ipc.cjs`                | Chiamate permesse alla pagina (solo dall'origine del sito)      |
| `main/ytdlp.cjs`              | Download, aggiornamento ed esecuzione di yt-dlp; cache          |
| `main/formats.cjs`            | Scelta degli stream dal JSON di yt-dlp (funzioni pure, testate) |
| `main/stream-protocol.cjs`    | `ppstream://`: proxy dei byte audio                             |
| `main/ranges.cjs`             | Calcolo degli intervalli di byte (puro, testato)                |
| `main/google-sign-in.cjs`     | Accesso con Google nel browser predefinito                      |
| `main/window-state.cjs`       | Posizione e dimensione della finestra                           |
| `preload.cjs`                 | Ponte verso la pagina                                           |
| `offline.html`                | Pagina "Nessuna connessione" al primo avvio senza internet      |
| `scripts/prepare.cjs`         | Copia identità e icona da `app.config.json` in `generated/`     |
| `electron-builder.config.cjs` | Installer NSIS (`dist/playlist-player-setup.exe`)               |

Il codice è JavaScript CommonJS con controllo dei tipi (`// @ts-check` + JSDoc, `tsconfig.json`).

## Comandi (dentro `desktop/`)

```powershell
npm install
```

```powershell
npm start
```

```powershell
npm run check
```

```powershell
npm run dist
```

`npm start` apre l'app sul sito pubblicato. Per provare modifiche della web app non ancora
pubblicate: `npm run build` e `npx vite preview --port 4173` nella radice, poi
`$env:PP_APP_URL = 'http://localhost:4173/playlist-player/'; npm start` in `desktop/`.

## Note

- L'installer non è firmato: Windows SmartScreen mostra un avviso al primo avvio
  ("Ulteriori informazioni" → "Esegui comunque"). Una firma richiede un certificato a pagamento.
- L'app si aggiorna installando il nuovo `playlist-player-setup.exe` sopra quello vecchio; serve
  di rado, perché interfaccia e yt-dlp si aggiornano da soli.
- Versione di Electron fissata in `desktop/package.json` (Dependabot la propone quando esce).
