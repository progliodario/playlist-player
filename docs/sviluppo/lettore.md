# Il lettore

**In breve**: uno store (`src/player/player-store.ts`) applica la logica pura della coda
(`src/domain/queue.ts`) e comanda il **motore** di questa sessione (`src/player/player-engine.ts`):
nel browser un solo iframe YouTube, nell'app Windows un `<video>` senza pubblicità, nell'app
Android il lettore nativo (la pagina gli passa la coda). Panoramica: [app-native.md](app-native.md).

## Pezzi

| File                                  | Responsabilità                                                       |
| ------------------------------------- | -------------------------------------------------------------------- |
| `src/domain/queue.ts`                 | Ordine, casuale, ripeti, avanti/indietro. Puro e testato.            |
| `src/player/youtube-iframe-api.ts`    | Carica la IFrame API, costanti di stato/errore, parametri del player |
| `src/player/player-engine.ts`         | Interfaccia comune dei motori e scelta del motore all'avvio          |
| `src/player/youtube-player-engine.ts` | Crea l'iframe una volta, load/play/pause/seek, titolo dell'iframe    |
| `src/player/stream-player-engine.ts`  | App Windows: `<video>` con audio `ppstream://` o video HLS (hls.js)  |
| `src/platform/android-player.ts`      | App Android: apre il lettore nativo con la coda (`intent://`)        |
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

## Motore "stream" (app Windows)

- Emette gli stessi stati `YT_STATE` dell'iframe: lo store non cambia.
- Musica: solo audio, con la copertina come sfondo del `<video>`; video: HLS con hls.js (caricato
  solo qui, i browser non lo scaricano mai).
- Se lo stream fallisce (URL scaduto) lo richiede una volta con `refresh: true`, poi segnala
  l'errore e lo store passa al brano successivo.
- Il brano successivo viene preparato in anticipo (`prefetch`).
- Gli eventi `pause` causati dal cambio di sorgente sono ignorati (`wantsPlay`).

## Regole YouTube che riguardano il lettore

Nel browser: player sempre visibile e ≥ 200×200 px, nessun elemento sopra l'iframe mentre suona,
niente riproduzione nascosta, niente blocco delle pubblicità. Le app hanno il loro lettore
(decisione 0015) → [regole-youtube.md](regole-youtube.md).
