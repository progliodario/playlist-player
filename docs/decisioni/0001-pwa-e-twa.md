# 0001 — Web app (PWA) + guscio Android TWA

- **Stato**: accettata
- **Data**: 2026-11-25

## Contesto

Serve un'app per Windows e Android, facile da mantenere da una persona o da un'AI. Il player YouTube incorporato richiede un'origine web vera (senza Referer: errore 153) e Google blocca il login OAuth nelle WebView e in Electron.

## Decisione

Un'unica web app React installabile come PWA (Windows con Edge/Chrome), pubblicata su GitHub Pages; per Android una Trusted Web Activity che la apre in Chrome.

## Conseguenze

Un solo codice; aggiornamenti immediati su tutti i dispositivi; nessuno store. Su Android serve Chrome.

Aggiunte successive, sempre attorno allo stesso sito: un lettore nativo nell'APK e un'app Windows
in Electron con l'accesso Google nel browser di sistema (decisione 0015,
[../sviluppo/app-native.md](../sviluppo/app-native.md)).
