# Le tre "case" dell'app e i tre motori di riproduzione

**In breve**: lo stesso sito gira in tre posti (browser, app Android, app Windows). All'avvio
`src/platform/shell.ts` capisce dove si trova e `src/player/player-engine.ts` sceglie chi suona.
Interfaccia, coda e libreria sono sempre quelle della web app.

## Dove gira e chi suona

| Casa (`getShell()`) | Come lo riconosce                                         | Motore (`playbackTarget`) | Chi suona davvero                                                              |
| ------------------- | --------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| `web`               | default                                                   | `youtube`                 | iframe di YouTube (`youtube-player-engine.ts`)                                 |
| `android`           | URL `?shell=android` (messo dall'APK), poi sessionStorage | `android`                 | lettore nativo dell'APK ([android.md](android.md))                             |
| `desktop`           | esiste `window.playlistPlayerDesktop` (preload)           | `stream`                  | `<video>` della pagina con stream da yt-dlp ([app-windows.md](app-windows.md)) |

In Android e Windows l'utente può tornare al player di YouTube: Impostazioni → Lettore →
"Player di YouTube" (`settings-store → playbackMode`, si applica dopo il ricaricamento). Serve se
un cambiamento di YouTube rompe il lettore senza pubblicità.

## Il contratto dei motori

`PlayerEngine` (`src/player/player-engine.ts`) ha gli stessi metodi per tutti (load, play, pause,
seekTo, volume…) e ogni motore riporta gli stati con i numeri `YT_STATE` di YouTube: così
`player-store.ts` (coda, casuale, ripeti, errori, ripresa) non cambia. Unica eccezione: con
`android` la pagina non suona nulla e `player-store` passa l'intera coda all'app
(`playInAndroidApp`, formato in `src/domain/handoff-payload.ts`).

```
Pagina web ──────────────┬─ youtube ─► iframe YouTube
  player-store ──────────┤
  (coda, comandi)        ├─ stream ──► <video> ◄─ ppstream:// ◄─ yt-dlp   (app Windows)
                         └─ android ─► intent://play … S.payload=<coda> ─► PlayerActivity
                                                                         └► PlaybackService (Media3)
```

## Dove mettere le mani

| Voglio…                                           | File                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Cambiare cosa passa la pagina all'app Android     | `src/domain/handoff-payload.ts` **e** `android/.../player/Handoff.kt` (stesso formato, `v`) |
| Cambiare il lettore Android (coda, errori, video) | `android/.../player/PlaybackService.kt`                                                     |
| Cambiare la schermata del lettore Android         | `android/.../player/ui/PlayerScreen.kt` (testi in `res/values*/strings.xml`)                |
| Cambiare come Windows trova gli stream            | `desktop/main/ytdlp.cjs`, scelta dei formati in `desktop/main/formats.cjs`                  |
| Cambiare cosa la pagina può chiedere a Windows    | `src/platform/desktop-bridge.ts` **e** `desktop/preload.cjs` + `desktop/main/ipc.cjs`       |
| Cambiare il lettore `<video>` della pagina        | `src/player/stream-player-engine.ts`                                                        |

## Quando YouTube cambia e il lettore smette di funzionare

1. **Windows**: yt-dlp si aggiorna da solo una volta al giorno; di solito basta aspettare o
   riavviare l'app. Se serve un altro client, `CLIENT_ATTEMPTS` in `desktop/main/ytdlp.cjs`.
2. **Android**: aggiorna `NewPipeExtractor` in `android/app/build.gradle` all'ultima versione
   (https://github.com/TeamNewPipe/NewPipeExtractor/releases), aumenta la versione e pubblica un
   nuovo APK ([deploy-e-rilasci.md](deploy-e-rilasci.md)).
3. Nel frattempo: Impostazioni → Lettore → "Player di YouTube".

Perché è fatto così: [decisione 0015](../decisioni/0015-lettori-senza-pubblicita.md).
