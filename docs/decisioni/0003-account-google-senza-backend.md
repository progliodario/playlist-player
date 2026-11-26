# 0003 — Account Google facoltativo, senza backend

- **Stato**: accettata
- **Data**: 2026-11-25

## Contesto

Per le playlist private serve OAuth; un backend costerebbe e andrebbe mantenuto.

## Decisione

Google Identity Services (token client, flusso implicito) direttamente nel browser, scope `youtube.readonly`. Client ID in `app.config.json` (non è un segreto).

## Conseguenze

Token di un'ora, poi "Riconnetti" (un clic). Richiede la configurazione una tantum in [../sviluppo/account-google.md](../sviluppo/account-google.md).
