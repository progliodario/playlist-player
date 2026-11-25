# Regole YouTube da rispettare

L'app usa servizi di YouTube (IFrame Player API, Data API v3, oEmbed) ed è quindi soggetta ai
[Termini di servizio delle API di YouTube](https://developers.google.com/youtube/terms/api-services-terms-of-service)
e alle [Norme per gli sviluppatori](https://developers.google.com/youtube/terms/developer-policies).
Queste regole sono vincoli di progetto: **non vanno rimosse per "migliorare" l'app**.

| Regola                                                               | Dove è applicata nel codice                                                                           |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Riprodurre solo con il **player ufficiale** incorporato (iframe)     | `src/player/youtube-player-engine.ts`                                                                 |
| Player **visibile**, mai nascosto o coperto, almeno **200×200 px**   | `src/styles/player.css` (`.player-viewport`), `PlayerViewport.tsx`                                    |
| Niente riproduzione **solo audio** con il video nascosto             | idem                                                                                                  |
| Niente **download** o cache di audio/video                           | nessun codice lo fa; il service worker mette in cache solo metadati e miniature                       |
| Non modificare/coprire pubblicità, logo o controlli del player       | nessun overlay sopra l'iframe durante la riproduzione (la locandina appare solo prima del primo play) |
| Accesso ai dati dell'utente solo in **lettura** e solo per mostrarli | scope `youtube.readonly`; token solo nel browser dell'utente                                          |
| Dichiarare che l'app **non è ufficiale**                             | Impostazioni → Informazioni                                                                           |

## Cose da NON fare anche se richieste

- Estrarre i flussi audio/video (es. con yt-dlp) per riprodurli fuori dal player di YouTube.
- Nascondere il player per fare un lettore "solo audio" o per l'ascolto a schermo spento.
- Salvare video o audio per l'ascolto offline.
- Rimuovere o bloccare le pubblicità.

`scripts/build-catalog.ts` usa yt-dlp **solo per leggere metadati pubblici** (titoli, durate, id)
delle playlist del proprietario del canale, in fase di build; non scarica contenuti.
