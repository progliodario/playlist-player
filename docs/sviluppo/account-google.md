# Attivare l'accesso con Google

**In breve**: serve **una volta sola**, a chi gestisce l'app, per creare un "OAuth Client ID" su
Google Cloud e scriverlo in `app.config.json`. Dopo, per gli utenti l'accesso è **un clic** su
"Accedi con Google". Serve solo per playlist private/non in elenco e video piaciuti: le playlist
pubbliche del canale funzionano senza.

Tempo: ~10 minuti. Costo: gratis.

## Stato attuale (già fatto)

L'accesso è **attivo** dalla versione 1.2.0. Configurazione esistente:

| Cosa                    | Valore                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Progetto Google Cloud   | `Playlist Player` (ID `playlist-player-515912`), senza organizzazione              |
| API abilitata           | YouTube Data API v3                                                                |
| Schermata di consenso   | Pubblico **Esterno**, stato **Test**, ambito `youtube.readonly`                    |
| Utenti di test          | l'account Google del proprietario del canale                                       |
| Client OAuth            | "Playlist Player web" (applicazione web), ID in `app.config.json`                  |
| Origini autorizzate     | `https://progliodario.github.io`, `http://localhost:5173`                          |
| URI di reindirizzamento | `http://127.0.0.1:43117/callback` (app Windows, `desktop/main/google-sign-in.cjs`) |

Cose che potresti voler fare:

- **Far accedere un altro account** (in modalità Test entrano solo gli utenti di test, max 100):
  <https://console.cloud.google.com/auth/audience?project=playlist-player-515912> → _Utenti di
  prova_ → **Add users**.
- **Cambiare l'URL dell'app**: aggiungi la nuova origine al client in
  <https://console.cloud.google.com/auth/clients?project=playlist-player-515912>.
- **Rifare tutto da zero** (altro account o altro progetto): segui i passi qui sotto.

## 1. Progetto e API

1. Apri <https://console.cloud.google.com/projectcreate> con l'account Google del canale →
   nome `playlist-player` → **Crea**.
2. Apri <https://console.cloud.google.com/apis/library/youtube.googleapis.com> (con il progetto
   selezionato in alto) → **Abilita**.

## 2. Schermata di consenso

1. Apri <https://console.cloud.google.com/auth/overview> → **Inizia**.
2. Nome app `Playlist Player`, email di assistenza: la tua → Pubblico: **Esterno** → contatto: la
   tua email → accetta le norme → **Crea**.
3. **Pubblico** → _Utenti di test_ → **Aggiungi utenti** → l'email del tuo account YouTube.
   (Modalità "Test": nessuna verifica di Google necessaria; al primo accesso compare "App non
   verificata" → **Continua**.)
4. **Accesso ai dati** → **Aggiungi o rimuovi ambiti** → cerca `youtube.readonly` → seleziona
   `.../auth/youtube.readonly` → **Aggiorna** → **Salva**.

## 3. Client ID

1. Apri <https://console.cloud.google.com/auth/clients/create>.
2. Tipo: **Applicazione web**, nome `Playlist Player`.
3. **Origini JavaScript autorizzate** (senza barra finale):
   - `https://progliodario.github.io`
   - `http://localhost:5173` (sviluppo)
4. **Crea** e copia l'**ID client** (`1234567890-xxxx.apps.googleusercontent.com`).
   Il "client secret" non serve.

## 4. Inserirlo nell'app

In `app.config.json`:

```json
"google": {
  "oauthClientId": "1234567890-xxxx.apps.googleusercontent.com"
}
```

Commit + push: in pochi minuti il deploy pubblica la nuova versione e il pulsante **Accedi con
Google** compare in Libreria e Impostazioni. Il Client ID **non è un segreto** (è visibile in ogni
pagina che lo usa).

Prova rapida senza modificare il codice (solo sul tuo dispositivo): Impostazioni → Account
Google → _OAuth Client ID (avanzato)_ → incolla → **Salva**.

## Problemi comuni

| Messaggio                                             | Causa / soluzione                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------- |
| `origin_mismatch` / `idpiframe_initialization_failed` | L'origine non è tra le "Origini JavaScript autorizzate" (http/https, porta) |
| `access_denied`                                       | L'account non è tra gli **utenti di test**                                  |
| Popup che si chiude subito                            | Popup bloccati dal browser: consentili per il sito                          |
| `quotaExceeded`                                       | Superate le 10.000 unità giornaliere dell'API: riprova domani               |
| Sessione scaduta dopo un'ora                          | Normale (token senza backend): un clic su **Riconnetti**                    |
