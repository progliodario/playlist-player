# Deploy, CI e rilasci

Tutto avviene con **GitHub Actions**; non serve nessun server.

## Workflow

| Workflow (file)                           | Quando parte                                   | Cosa fa                                                        |
| ----------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| **CI** (`ci.yml`)                         | ogni push e pull request                       | `npm run check` + `npm run build`                              |
| **Deploy to GitHub Pages** (`deploy.yml`) | push su `main`, ogni giorno 03:23 UTC, manuale | genera il catalogo con yt-dlp, build, pubblica su GitHub Pages |
| **Android APK** (`android.yml`)           | push di un tag `v*`, manuale                   | build e firma dell'APK, Release con l'APK                      |

Esecuzione manuale: tab **Actions** → scegli il workflow → **Run workflow**.

## GitHub Pages

- Impostazioni del repository → **Pages** → Source: **GitHub Actions** (già configurato).
- URL: `app.config.json → publicUrl` = <https://progliodario.github.io/playlist-player/>.
- `basePath` in `app.config.json` deve corrispondere al nome del repository
  (`/playlist-player/`). Se rinomini il repository, aggiorna `basePath`, `publicUrl`,
  `repositoryUrl` e le origini del client OAuth.

## Aggiornamento giornaliero del catalogo

Il deploy delle 03:23 UTC rilegge le playlist del canale, così le modifiche fatte su YouTube
compaiono nell'app entro un giorno (o subito con **Run workflow**).

- Se YouTube rifiuta le richieste dai server di GitHub, lo script riusa il catalogo già online
  (il log del passo "Build playlist catalog" lo dice). Il deploy non fallisce.
- GitHub **disattiva i workflow programmati dopo 60 giorni senza attività** nel repository.
  Se succede: tab Actions → "Deploy to GitHub Pages" → **Enable workflow**.

## Rilasciare una versione

1. Aggiorna la versione (stesso numero ovunque):
   - `package.json` → `version`
   - `app.config.json` → `android.versionName` e `android.versionCode` (+1)
2. Aggiungi la sezione della versione in `CHANGELOG.md`.
3. `npm run check`, commit, push su `main` → il sito si aggiorna.
4. Per un nuovo APK: `git tag vX.Y.Z` e `git push origin vX.Y.Z` → Release automatica.

## Secrets del repository

| Secret                                                                                              | Usato da      |
| --------------------------------------------------------------------------------------------------- | ------------- |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | `android.yml` |

Il client OAuth Google non è un segreto e sta in `app.config.json`.
