# 0015 — Lettori senza pubblicità e in background nelle app Android e Windows

- **Stato**: accettata (sostituisce la [0011](0011-niente-blocco-pubblicita-e-background.md))
- **Data**: 2026-11-26

## Contesto

Il proprietario ha chiesto in modo esplicito, una seconda volta, l'ascolto a schermo spento e
nessuna pubblicità, accettando il rischio di andare contro i termini di YouTube. Una pagina web non
può farlo: il player di YouTube è un iframe che non si può modificare e gli stream di YouTube non
sono leggibili da una pagina (CORS). Si può fare solo dentro un'app che legge gli stream da sola,
come fanno NewPipe (Android) e yt-dlp (computer).

## Decisione

- **Browser e PWA**: restano con il player ufficiale di YouTube (unica possibilità tecnica).
- **App Android**: lettore nativo nell'APK (Media3 + [NewPipeExtractor](https://github.com/TeamNewPipe/NewPipeExtractor)).
  La pagina web, quando gira dentro l'app, gli passa la coda con un link `intent://`.
- **App Windows**: nuova app Electron (`desktop/`) con lettore `<video>`; gli stream li trova
  [yt-dlp](https://github.com/yt-dlp/yt-dlp), scaricato e aggiornato dall'app stessa.
- In entrambe le app un'impostazione riporta al player di YouTube, se un cambiamento di YouTube
  rompe il lettore senza pubblicità prima che arrivi un aggiornamento.
- Il catalogo, l'accesso con Google (Data API, sola lettura) e il resto restano come prima.

## Conseguenze

- Le app violano le Norme per gli sviluppatori di YouTube (niente pubblicità, riproduzione in
  background, uso degli stream fuori dal player). Rischi accettati dal proprietario: sospensione
  del progetto Google Cloud (accesso con Google), segnalazione del repository. L'account YouTube di
  chi ascolta non è toccato (gli stream sono letti senza accesso).
- I contenuti non vengono scaricati né conservati: si ascoltano in streaming come nel player.
- YouTube cambia spesso: quando il lettore smette di funzionare si aggiorna NewPipeExtractor
  (`android/app/build.gradle`, nuova versione dell'APK); yt-dlp su Windows si aggiorna da solo.
- NewPipeExtractor è GPL-3.0: l'APK e la cartella `android/` sono distribuiti con licenza
  GPL-3.0-or-later (`android/LICENSE`); il resto del repository resta MIT.
- Dettagli: [../sviluppo/regole-youtube.md](../sviluppo/regole-youtube.md),
  [../sviluppo/app-native.md](../sviluppo/app-native.md).
