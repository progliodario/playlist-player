# 0002 — Catalogo pubblico generato in CI con yt-dlp

- **Stato**: accettata
- **Data**: 2026-11-25

## Contesto

L'utente non vuole configurare nulla; le API di YouTube richiedono chiave o OAuth anche per le playlist pubbliche e il browser non può leggere le pagine di YouTube (CORS).

## Decisione

GitHub Actions legge i metadati delle playlist pubbliche del canale con yt-dlp (`--flat-playlist`, nessun download) e li pubblica come JSON statici insieme al sito.

## Conseguenze

Funziona senza login e senza chiavi. Le playlist private richiedono la sorgente "account". Se YouTube blocca la CI si riusa il catalogo già online.
