# Attivare l'accesso con Google (facoltativo)

Serve **solo** per vedere playlist private/non in elenco e i video piaciuti. Le playlist
pubbliche del canale funzionano senza.

Tempo: ~10 minuti, una volta sola. Costo: gratis.

## 1. Progetto Google Cloud

1. Vai su <https://console.cloud.google.com/> con il tuo account Google e accetta i termini se richiesto.
2. In alto: selettore progetti → **Nuovo progetto** → nome `playlist-player` → **Crea**.
3. Menu ☰ → **API e servizi** → **Libreria** → cerca **YouTube Data API v3** → **Abilita**.

## 2. Schermata di consenso OAuth

1. **API e servizi** → **Schermata di consenso OAuth** (o "Google Auth Platform").
2. Tipo di utente: **Esterno** → nome app `Playlist Player`, email di supporto e email dello
   sviluppatore: la tua.
3. **Ambiti/Scopes**: aggiungi `https://www.googleapis.com/auth/youtube.readonly`.
4. **Utenti di test**: aggiungi l'indirizzo Gmail del tuo account YouTube.
5. Lascia l'app in modalità **Test** (nessuna verifica necessaria per uso personale; al login
   Google mostrerà "App non verificata" → **Continua**).

## 3. Client ID

1. **API e servizi** → **Credenziali** → **Crea credenziali** → **ID client OAuth**.
2. Tipo di applicazione: **Applicazione web**, nome `Playlist Player`.
3. **Origini JavaScript autorizzate** (senza barra finale):
   - `https://progliodario.github.io`
   - `http://localhost:5173` (per lo sviluppo)
4. URI di reindirizzamento: nessuno. → **Crea** e copia l'**ID client**
   (`1234567890-xxxx.apps.googleusercontent.com`). Non serve il "client secret".

## 4. Inserirlo nell'app

Modo consigliato (vale per tutti i dispositivi): in `app.config.json`

```json
"google": {
  "oauthClientId": "1234567890-xxxx.apps.googleusercontent.com"
}
```

poi commit + push: il deploy automatico pubblica la nuova versione in pochi minuti.
Il Client ID **non è un segreto** (è visibile in ogni pagina che lo usa), può stare nel repository.

Modo rapido (solo su un dispositivo, senza toccare il codice): app → **Impostazioni** →
**Account Google** → _OAuth Client ID (avanzato)_ → incolla → **Salva**.

## 5. Usarlo

Impostazioni → **Accedi con Google** → scegli l'account → consenti l'accesso in sola lettura.
In Libreria compare la sezione **Il tuo account**.

## Problemi comuni

| Messaggio                                             | Causa / soluzione                                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `idpiframe_initialization_failed` / `origin_mismatch` | L'origine non è tra le "Origini JavaScript autorizzate" (controlla http/https e porta). |
| `access_denied`                                       | Il tuo account non è tra gli **utenti di test** della schermata di consenso.            |
| Popup che si chiude subito                            | Popup bloccati dal browser: consentili per il sito.                                     |
| `quotaExceeded`                                       | Superate le 10.000 unità giornaliere dell'API: riprova domani.                          |
| Sessione scaduta dopo un'ora                          | Normale (token senza backend): premi **Riconnetti**.                                    |
