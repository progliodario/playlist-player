# 0005 — Un solo iframe YouTube, layout solo CSS

- **Stato**: accettata
- **Data**: 2026-11-25

## Contesto

Spostare o ricreare un iframe lo ricarica e interrompe la musica.

## Decisione

`<NowPlayingPanel/>` e `<PlayerViewport/>` sono montati una volta; desktop/telefono cambiano solo con CSS grid.

## Conseguenze

Qualsiasi nuovo layout deve rispettare questo vincolo (dettagli in [../sviluppo/lettore.md](../sviluppo/lettore.md)).
