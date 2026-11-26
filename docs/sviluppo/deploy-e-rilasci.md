# Deploy, CI e rilasci

**In breve**: tutto avviene con GitHub Actions, nessun server. Il sito si pubblica a ogni push su
`main` e, in automatico, ogni volta che le playlist pubbliche del canale cambiano (controllo ogni
15 minuti). L'APK si pubblica con un tag `vX.Y.Z`.

## Workflow

| Workflow (file)                           | Quando parte                                 | Cosa fa                                                                                    |
| ----------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **CI** (`ci.yml`)                         | ogni push e pull request                     | `npm run check` (tipi, lint, formattazione, test) + build                                  |
| **Deploy to GitHub Pages** (`deploy.yml`) | push su `main`, ogni 15 minuti, manuale      | genera il catalogo; se è cambiato (o non è un controllo programmato) build e pubblicazione |
| **Android APK** (`android.yml`)           | tag `v*`, PR che toccano `android/`, manuale | build e firma dell'APK; con un tag crea la Release                                         |

Esecuzione manuale: tab **Actions** → scegli il workflow → **Run workflow**.

### Il controllo ogni 15 minuti in dettaglio

1. `npm run catalog -- --fallback-to-published` rilegge le playlist con yt-dlp.
2. `node scripts/catalog-changed.ts` confronta il `contentHash` con quello online e scrive
   `changed=true|false`.
3. Se non è cambiato nulla il workflow finisce (riepilogo: "Playlists unchanged") senza deploy.
4. Il passo "Keep the schedule alive" riattiva il workflow via API: GitHub disattiva le
   programmazioni dopo 60 giorni senza attività nel repository.

Se YouTube blocca le richieste dalla CI, il passo 1 riusa il catalogo online: niente deploy, niente
errori. Se succede spesso, aumenta l'intervallo nel `cron` di `deploy.yml`.

## GitHub Pages

- Impostazioni del repository → **Pages** → Source: **GitHub Actions** (già configurato).
- URL: `app.config.json → publicUrl` = <https://progliodario.github.io/playlist-player/>.
- `basePath` deve corrispondere al nome del repository (`/playlist-player/`). Se rinomini il
  repository aggiorna `basePath`, `publicUrl`, `repositoryUrl` e le origini del client OAuth.

## Rilasciare una versione

1. Aggiorna la versione, stesso numero ovunque:
   - `package.json` → `version`
   - `app.config.json` → `android.versionName` e `android.versionCode` (+1)
2. Aggiungi la sezione della versione in `CHANGELOG.md`.
3. `npm run check`, commit, push su `main` → il sito si aggiorna.
4. Nuovo APK: `git tag vX.Y.Z` e `git push origin vX.Y.Z` → Release con l'APK allegato.
   Il workflow verifica che il tag corrisponda a `android.versionName`.

## Secrets del repository

| Secret                                                                                              | Usato da      |
| --------------------------------------------------------------------------------------------------- | ------------- |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | `android.yml` |

Il client OAuth Google non è un segreto e sta in `app.config.json`.

## Aggiornamenti delle dipendenze

Dependabot (`.github/dependabot.yml`) apre PR mensili. Unisci solo se la CI è verde (per
`android/` anche il workflow Android). Gli aggiornamenti major esclusi sono motivati in
[../decisioni/](../decisioni/README.md).
