# Il lettore

**In breve**: un solo iframe YouTube per tutta l'app (`src/player/youtube-player-engine.ts`),
guidato da uno store (`src/player/player-store.ts`) che applica la logica pura della coda
(`src/domain/queue.ts`).

## Pezzi

| File                                  | Responsabilità                                                       |
| ------------------------------------- | -------------------------------------------------------------------- |
| `src/domain/queue.ts`                 | Ordine, casuale, ripeti, avanti/indietro. Puro e testato.            |
| `src/player/youtube-iframe-api.ts`    | Carica la IFrame API, costanti di stato/errore, parametri del player |
| `src/player/youtube-player-engine.ts` | Crea l'iframe una volta, load/play/pause/seek, titolo dell'iframe    |
| `src/player/player-store.ts`          | Stato e comandi; collega coda ↔ engine; salva la posizione           |
| `src/ui/player/PlayerViewport.tsx`    | Il riquadro che ospita l'iframe (mai smontato)                       |
| `src/ui/player/NowPlayingPanel.tsx`   | Pannello/striscia del lettore                                        |

## Ciclo di vita

1. **Riproduci** → `actions.playPlaylistByKey()` carica la playlist e chiama
   `usePlayerStore.playPlaylist()`.
2. Lo store crea la coda e chiede all'engine il video; l'engine crea l'iframe **la prima volta**
   dentro `<PlayerViewport/>` e poi lo riusa (spostarlo o ricrearlo fermerebbe la musica).
3. Gli eventi YouTube tornano allo store:
   - `PLAYING` → stato "playing", parte il timer del tempo;
   - `ENDED` → `queue.next('ended')` (rispetta "ripeti brano") → brano successivo o fine coda;
   - errore (video rimosso, incorporamento vietato…) → brano segnato, salto dopo 1,2 s; dopo 5
     errori di fila si ferma.
4. Mentre suona: `usePlayerClock` si aggiorna 2 volte al secondo; la posizione si salva ogni 5 s.
5. Alla riapertura la coda torna, il riquadro mostra la miniatura; play riparte dal punto salvato.

## `status` e `playIntent`

- `status` = ciò che YouTube ha comunicato (`loading`, `playing`, `paused`, `buffering`, `ended`).
- `playIntent` = ciò che l'utente vuole (play o pausa).

Il pulsante play/pausa, il titolo della finestra, gli annunci e le animazioni seguono
**`playIntent`**, perché **durante le pubblicità YouTube non invia eventi di stato**: basandosi
solo su `status` il pulsante resterebbe bloccato. Pausa e play aggiornano `playIntent` subito
(in modo "ottimistico"); gli eventi YouTube lo correggono quando arrivano.

## Accessibilità del lettore

- L'iframe ha sempre un `title` ("Video YouTube: …") impostato dall'engine.
- Barra di avanzamento e volume hanno `aria-valuetext` leggibili ("1:05 di 3:02", "80%").
- I pulsanti dichiarano le scorciatoie (`aria-keyshortcuts`) se attive.
- Il cambio brano viene annunciato (`useTrackAnnouncements` in `src/app/effects.ts`).

## Regole YouTube che riguardano il lettore

Player sempre visibile e ≥ 200×200 px, nessun elemento sopra l'iframe mentre suona, niente
riproduzione nascosta o in background, niente blocco delle pubblicità →
[regole-youtube.md](regole-youtube.md).
