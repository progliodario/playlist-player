# YouTube: regole e scelte del progetto

**In breve**: la versione **web** (browser e PWA) usa il player ufficiale di YouTube e ne rispetta
le regole. Le **app Android e Windows** hanno, per scelta esplicita del proprietario, un lettore
proprio senza pubblicità che suona anche in background
([decisione 0015](../decisioni/0015-lettori-senza-pubblicita.md)): questo va contro le
[Norme per gli sviluppatori](https://developers.google.com/youtube/terms/developer-policies) di
YouTube, con i rischi descritti qui sotto.

## Cosa usa l'app e con quali regole

| Parte                                 | Servizio di YouTube                                | Regole                                                                                                                                                                            |
| ------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web: lettore                          | IFrame Player API (`youtube-player-engine.ts`)     | Player visibile e ≥ 200×200 px, nulla sopra l'iframe, niente blocco pubblicità, niente background ([guida](https://developers.google.com/youtube/terms/developer-policies-guide)) |
| Tutte: accesso con Google             | Data API v3, scope `youtube.readonly`              | [Termini delle API](https://developers.google.com/youtube/terms/api-services-terms-of-service): dati solo in lettura e solo nel dispositivo                                       |
| Catalogo (CI)                         | pagine pubbliche lette da yt-dlp (`build-catalog`) | Solo metadati pubblici (titoli, durate, id), nessun contenuto                                                                                                                     |
| App Android: lettore senza pubblicità | stream letti da NewPipeExtractor                   | **Fuori dalle norme** (scelta del proprietario)                                                                                                                                   |
| App Windows: lettore senza pubblicità | stream letti da yt-dlp                             | **Fuori dalle norme** (scelta del proprietario)                                                                                                                                   |

Valgono sempre, anche nelle app:

- **niente download** né cache di audio/video: solo streaming (il service worker conserva
  metadati e miniature; le app non salvano i media);
- **dati dell'utente solo in lettura**, senza server: il token resta sul dispositivo;
- l'app dichiara di **non essere ufficiale** (Impostazioni → Informazioni).

## Rischi accettati (decisione 0015)

| Rischio                                                    | Cosa succederebbe                             | Come si rimedia                                                                                                               |
| ---------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Google sospende il progetto Cloud `playlist-player-515912` | Smette di funzionare solo "Accedi con Google" | Nuovo progetto ([account-google.md](account-google.md)), o senza accesso                                                      |
| YouTube cambia e il lettore non trova più gli stream       | I brani vengono saltati nelle app             | Android: aggiorna NewPipeExtractor; Windows: yt-dlp si aggiorna da solo; intanto Impostazioni → Lettore → "Player di YouTube" |
| Segnalazione del repository su GitHub                      | Il repository potrebbe essere nascosto        | Il codice non contiene contenuti di YouTube né chiavi                                                                         |

## Per chi modifica il codice

- Nel **browser** non provare a togliere pubblicità o a suonare con il player nascosto: non è
  possibile tecnicamente (iframe di un altro sito) e resta vietato.
- I lettori senza pubblicità vivono **solo** nelle app: `android/.../player/` e `desktop/main/`.
  La pagina sceglie il motore in `src/player/player-engine.ts`.
- Non aggiungere download, conversione in MP3 o salvataggio offline: sarebbe un passo in più
  (copia dei contenuti) che il proprietario non ha chiesto.
