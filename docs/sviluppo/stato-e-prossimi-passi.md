# Stato del progetto e prossimi passi

**In breve**: da dove riprendere il lavoro. Cosa funziona ed è verificato, cosa non è ancora
verificato, i limiti noti, la manutenzione da fare e le idee per il futuro. Aggiorna questo file
quando chiudi o apri uno di questi punti.

Ultimo aggiornamento: 26 novembre 2026, versione 1.3.1.

## Riprendere il lavoro in 5 minuti

1. Leggi [AGENTS.md](../../AGENTS.md) (mappa, regole, ricette), poi questo file.
2. `npm install` e `npm run desktop:install` (solo se tocchi l'app Windows).
3. `npm run check:all`: tipi, lint, formattazione e tutti i test di web app, script, documentazione e
   app Windows. L'app Android si compila e si testa nella CI (workflow **Android APK**).
4. Prova: `npm run dev` (sito) e `npm run desktop:start` (app Windows sul sito pubblicato).
5. Pubblica come in [deploy-e-rilasci.md](deploy-e-rilasci.md): push su `main` per il sito, tag
   `vX.Y.Z` per APK e installer Windows.

## Cosa funziona ed è verificato

| Parte                                            | Verificato come                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Sito e PWA (libreria, playlist, lettore YouTube) | Test automatici (dominio, contrasti, axe-core su tutte le pagine), prova nel browser                                             |
| Catalogo del canale e controllo dei cambiamenti  | CI: `Found 66 playlists`, `contentHash` confrontato a ogni esecuzione                                                            |
| Accesso con Google (sito)                        | Confermato dal proprietario                                                                                                      |
| App Windows: lettore senza pubblicità            | Provata su questo computer, anche impacchettata: play, ricerca nel brano, successivo, pausa, video HLS 1080p, tasti multimediali |
| App Android: compilazione e firma                | CI: test unitari, APK firmato con la chiave di sempre, Digital Asset Links validi                                                |
| App Android: si apre senza chiudersi             | CI (**Android smoke test**): emulatori Android 12, 14 e 16 con Chrome, app + lettore nativo + background                         |
| Sito che si aggiorna da solo                     | Il service worker attiva la nuova versione senza chiudere l'app                                                                  |

## Non ancora verificato

- **Lettore nativo Android su un telefono vero**: si apre senza errori sugli emulatori e la parte
  che trova gli stream (NewPipeExtractor) è stata provata su computer, ma l'audio vero su un
  telefono non è ancora confermato (la 1.3.0 si chiudeva all'avvio, corretto nella 1.3.1). Se
  qualcosa non va: `android/scripts/smoke-test.sh` con il telefono collegato, oppure Impostazioni →
  Lettore → "Player di YouTube".
- **Accesso con Google nell'app Windows** fino in fondo (serve l'account del proprietario): è
  verificato solo che Google accetta l'indirizzo di ritorno `http://127.0.0.1:43117/callback`.
- **Controllo programmato del catalogo**: GitHub esegue le programmazioni "al meglio"; con
  `*/15` partiva di rado. Dal 26/11 gira ai minuti 7/22/37/52: controlla nella tab Actions che
  compaiano esecuzioni `schedule` regolari.

## Limiti noti

| Limite                                                          | Perché / dove                                                                             |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Nel browser restano le pubblicità e niente background           | Una pagina può usare solo il player di YouTube ([regole-youtube.md](regole-youtube.md))   |
| Sottotitoli dei video non mostrati nei lettori senza pubblicità | Non ancora implementati (Media3 e hls.js li supportano)                                   |
| Schermata del lettore Android solo in tema scuro                | `ui/PlayerTheme.kt` ha solo "Notturno"                                                    |
| Installer Windows non firmato (avviso SmartScreen)              | Una firma di codice è a pagamento                                                         |
| L'app Windows non si aggiorna da sola                           | Interfaccia e yt-dlp sì; il guscio Electron no (manca electron-updater)                   |
| APK da reinstallare a mano a ogni versione                      | Non è sul Play Store                                                                      |
| Accesso Google solo per gli "utenti di test"                    | App OAuth in modalità Test ([account-google.md](account-google.md))                       |
| Lettori senza pubblicità contro le regole di YouTube            | Scelta del proprietario ([decisione 0015](../decisioni/0015-lettori-senza-pubblicita.md)) |

## Manutenzione

| Quando                                               | Cosa fare                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Ogni mese (PR di Dependabot)                         | Unisci se la CI è verde; per `android/` serve anche il workflow Android                                |
| Quando il lettore delle app non trova più gli stream | [app-native.md](app-native.md) § Quando YouTube cambia                                                 |
| Quando esce un AGP major                             | [decisione 0010](../decisioni/0010-versione-agp.md): AGP e Gradle insieme, in una PR                   |
| Ogni anno circa                                      | Alza `targetSdk` in `android/app/build.gradle` dopo aver provato l'app sulla nuova versione di Android |
| Se cambia la chiave di firma                         | Aggiorna `assetlinks.json` nel repository `progliodario.github.io` ([android.md](android.md))          |

**Chiave di firma Android**: i GitHub Secrets non si possono rileggere. Senza una copia del file
`.jks` e delle sue password, i nuovi APK non si potrebbero installare sopra quelli vecchi. Tienine
una copia fuori dal repository (es. un gestore di password); vedi [android.md](android.md) § Firma.

## Idee per i prossimi passi

- Android: provare su più telefoni; sottotitoli; ripresa della riproduzione dai comandi di sistema
  dopo un riavvio (Media3 `onPlaybackResumption`); tema "Alba" anche nel lettore nativo.
- Windows: aggiornamento automatico dell'app (electron-updater con le Release di GitHub); comandi
  nella miniatura della barra delle applicazioni.
- Tutte: sottotitoli; scelta della qualità del video.
- Google: verifica dell'app OAuth (serve per uscire dalla modalità Test con lo scope
  `youtube.readonly`).
