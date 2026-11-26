# 0012 — Catalogo controllato ogni 15 minuti, deploy solo se cambia

- **Stato**: accettata
- **Data**: 2026-11-26

## Contesto

Una playlist nuova sul canale compariva solo al deploy giornaliero o al push successivo.

## Decisione

`deploy.yml` gira ogni 15 minuti; `contentHash` (SHA-256 del contenuto) e `scripts/catalog-changed.ts` decidono se pubblicare. L'app aperta ricontrolla `index.json` ogni 5 minuti; il service worker usa _network first_ per il catalogo.

## Conseguenze

Le modifiche arrivano entro circa 15-20 minuti senza deploy inutili. Più richieste a YouTube dalla CI: se diventano un problema basta allungare il `cron`.

Aggiornamento (2026-11-26): con `*/15` GitHub ha eseguito il controllo una sola volta in 13 ore, perché scarta le esecuzioni programmate nei minuti più affollati (0, 15, 30, 45). Il `cron` è ora `7,22,37,52 * * * *`. Le esecuzioni programmate di GitHub restano "al meglio": il controllo manuale (Actions → Run workflow) e l'accesso con Google (playlist lette in diretta) coprono i ritardi.
