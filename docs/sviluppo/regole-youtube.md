# Regole YouTube da rispettare

**In breve**: l'app usa servizi di YouTube (IFrame Player API, Data API v3, oEmbed) ed è soggetta ai
[Termini di servizio delle API](https://developers.google.com/youtube/terms/api-services-terms-of-service),
alle [Norme per gli sviluppatori](https://developers.google.com/youtube/terms/developer-policies)
(spiegate nella [guida alla conformità](https://developers.google.com/youtube/terms/developer-policies-guide))
e alle [Funzionalità minime richieste](https://developers.google.com/youtube/terms/required-minimum-functionality).
Sono vincoli di progetto: **non vanno rimossi per "migliorare" l'app**. Violarli può portare alla
sospensione del progetto Google Cloud (accesso con Google) e alla rimozione del repository.

| Regola                                                                           | Dove è applicata                                                                          |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Riprodurre solo con il **player ufficiale** incorporato                          | `src/player/youtube-player-engine.ts`                                                     |
| Player **visibile** e almeno **200×200 px** mentre riproduce                     | `.player-viewport` in `src/styles/player.css`, `PlayerViewport.tsx`                       |
| **Niente riproduzione in background** (finestra chiusa/ridotta, player nascosto) | nessun codice la forza; il player resta nel layout                                        |
| **Non bloccare le pubblicità** né i controlli/il marchio del player              | nessun elemento sopra l'iframe durante la riproduzione                                    |
| Niente riproduzione automatica se il player non è visibile per oltre metà        | la riproduzione parte solo da un'azione dell'utente o a fine brano con il player visibile |
| Niente **download** o cache di audio/video                                       | il service worker conserva solo metadati e miniature                                      |
| Dati dell'utente solo in **lettura** e solo per mostrarli                        | scope `youtube.readonly`; token solo nel browser dell'utente                              |
| Dichiarare che l'app **non è ufficiale**                                         | Impostazioni → Informazioni                                                               |

## Richieste frequenti che NON si possono soddisfare (e cosa offrire invece)

| Richiesta                                                | Perché no                                 | Alternativa lecita (già nell'app)                                                             |
| -------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Togliere le pubblicità                                   | Vietato bloccare le pubblicità del player | YouTube Premium: con l'accesso a YouTube nello stesso browser il player non mostra pubblicità |
| Ascolto a schermo spento / in background                 | Vietata la riproduzione in background     | Pulsante "Apri in YouTube Music": l'app ufficiale con Premium suona in background             |
| Estrarre l'audio (es. con yt-dlp) per un lettore proprio | Vietato separare/scaricare i contenuti    | —                                                                                             |
| Salvare brani per l'ascolto offline                      | Vietato scaricare/cache dei media         | Download ufficiali di YouTube Premium nell'app ufficiale                                      |

`scripts/build-catalog.ts` usa yt-dlp **solo per leggere metadati pubblici** (titoli, durate, id)
delle playlist del canale, in fase di build; non scarica contenuti.
