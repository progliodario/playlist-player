# Deploy, CI e rilasci

**In breve**: tutto avviene con GitHub Actions, nessun server. Il sito si pubblica a ogni push su
`main` e, in automatico, ogni volta che le playlist pubbliche del canale cambiano (controllo ogni
15 minuti). Con un tag `vX.Y.Z` si pubblicano l'APK Android e l'installer Windows nella stessa
Release.

## Workflow

| Workflow (file)                              | Quando parte                                 | Cosa fa                                                                                    |
| -------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **CI** (`ci.yml`)                            | ogni push e pull request                     | `npm run check` (tipi, lint, formattazione, test) + build                                  |
| **Deploy to GitHub Pages** (`deploy.yml`)    | push su `main`, ogni 15 minuti, manuale      | genera il catalogo; se è cambiato (o non è un controllo programmato) build e pubblicazione |
| **Android APK** (`android.yml`)              | tag `v*`, PR che toccano `android/`, manuale | test, build e firma dell'APK; con un tag lo allega alla Release                            |
| **Android smoke test** (`android-smoke.yml`) | PR che toccano `android/`, manuale           | apre app e lettore su emulatori Android 12/14/16; fallisce se l'app si chiude              |
| **Windows app** (`desktop.yml`)              | tag `v*`, PR che toccano `desktop/`, manuale | tipi, test e installer `playlist-player-setup.exe`; con un tag lo allega alla Release      |

Esecuzione manuale: tab **Actions** → scegli il workflow → **Run workflow**.

### Il controllo ogni 15 minuti in dettaglio

0. Orario: ai minuti 7, 22, 37 e 52 di ogni ora (non `*/15`: GitHub scarta molte esecuzioni
   programmate ai minuti 0/15/30/45, i più affollati). GitHub può comunque ritardarle o saltarle
   nei momenti di carico; chi ha fatto l'accesso con Google vede le proprie playlist subito.
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
3. `npm run check`, commit, push su `main` → il sito si aggiorna. Se hai toccato `android/`, la
   PR deve avere verde anche **Android smoke test** (l'app si apre senza chiudersi).
4. App: `git tag vX.Y.Z` e `git push origin vX.Y.Z` → Release con l'APK e l'installer Windows.
   I workflow verificano che il tag corrisponda a `android.versionName` e a `package.json`.

## Secrets del repository

| Secret                                                                                              | Usato da      |
| --------------------------------------------------------------------------------------------------- | ------------- |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | `android.yml` |

Il client OAuth Google non è un segreto e sta in `app.config.json`.

## Aggiornamenti delle dipendenze

Dependabot (`.github/dependabot.yml`) apre PR mensili. Unisci solo se la CI è verde (per
`android/` anche il workflow Android, per `desktop/` il workflow Windows). Per le librerie Android
se fallisce `checkReleaseAarMetadata` la libreria chiede un compileSdk o un AGP più recente
(decisione 0010). Gli aggiornamenti major esclusi sono motivati in
[../decisioni/](../decisioni/README.md).
