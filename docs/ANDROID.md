# App Android

## Come funziona

L'APK è una **Trusted Web Activity (TWA)**: un piccolo launcher (libreria ufficiale
[android-browser-helper](https://github.com/GoogleChrome/android-browser-helper)) che apre
`app.config.json → publicUrl` dentro **Chrome**, a schermo intero, con icona e splash propri.

- Nessuna logica nell'APK: tutto è nel sito. Ogni deploy del sito aggiorna anche l'app.
- Il login Google e il player YouTube funzionano come in Chrome (in una WebView non funzionerebbero:
  vedi [DECISIONS.md](DECISIONS.md)).
- Requisito sul telefono: Google Chrome (o un altro browser compatibile con TWA). Senza, l'app
  apre una Custom Tab.

## File

| File                                                       | Contenuto                                                        |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `android/app/build.gradle`                                 | Legge nome, URL, package, versione e colore da `app.config.json` |
| `android/app/src/main/AndroidManifest.xml`                 | Launcher TWA, splash, link verificati                            |
| `android/app/src/main/res/mipmap-*`, `drawable/splash.png` | Icone generate da `npm run icons`                                |
| `android/build.gradle`                                     | Versione dell'Android Gradle Plugin                              |
| `.github/workflows/android.yml`                            | Build in CI e pubblicazione della Release                        |

Versioni: Android Gradle Plugin 8.13.2, Gradle 8.14.3, JDK 17, compileSdk/targetSdk 36, minSdk 23.

## Pubblicare un nuovo APK

1. Aumenta in `app.config.json`: `android.versionCode` (+1, intero) e `android.versionName`
   (es. `1.1.0`, uguale a `package.json → version`).
2. Commit, poi tag: `git tag v1.1.0 && git push --tags`.
3. Il workflow **Android APK** costruisce, firma e crea la Release `v1.1.0` con l'APK allegato.

Per una build di prova senza Release: tab **Actions** → **Android APK** → **Run workflow**
(l'APK è tra gli _artifacts_ del run).

## Firma

L'APK è firmato con una chiave salvata nei **GitHub Secrets** del repository:

| Secret                      | Contenuto                        |
| --------------------------- | -------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | file `.jks` codificato in base64 |
| `ANDROID_KEYSTORE_PASSWORD` | password del keystore            |
| `ANDROID_KEY_ALIAS`         | alias della chiave               |
| `ANDROID_KEY_PASSWORD`      | password della chiave            |

Android installa un aggiornamento solo se è firmato con **la stessa chiave**. Se la chiave va
persa o cambiata: disinstalla l'app dal telefono e installa il nuovo APK (si perdono solo le
impostazioni locali).

Creare una nuova chiave (solo se serve):

```powershell
keytool -genkeypair -keystore release.jks -alias playlistplayer -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Playlist Player"
```

```powershell
gh secret set ANDROID_KEYSTORE_BASE64 --body ([Convert]::ToBase64String([IO.File]::ReadAllBytes("release.jks")))
```

(e gli altri tre secret con `gh secret set NOME`). Non committare mai il file `.jks`
(è in `.gitignore`).

## Togliere la barra dell'indirizzo (Digital Asset Links)

Chrome mostra l'app senza barra dell'indirizzo solo se il **dominio** dichiara l'app nel file
`https://<dominio>/.well-known/assetlinks.json`. Il sito è su `progliodario.github.io/playlist-player/`,
quindi il file deve stare nella **radice** `progliodario.github.io`, cioè nel repository speciale
`progliodario/progliodario.github.io`. Finché non c'è, l'app funziona ugualmente ma con una
sottile barra con l'indirizzo in alto.

Per attivarlo:

1. Copia l'impronta **SHA-256** del certificato dal riepilogo dell'ultimo run del workflow
   **Android APK** (sezione "Signing certificate").
2. Crea il repository `progliodario.github.io` (pubblico, con GitHub Pages attivo sul branch `main`)
   contenente `.well-known/assetlinks.json`:

   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "io.github.progliodario.playlistplayer",
         "sha256_cert_fingerprints": ["AA:BB:...:FF"]
       }
     }
   ]
   ```

   e un file vuoto `.nojekyll` (altrimenti GitHub Pages ignora le cartelle che iniziano con il punto).

3. Verifica: <https://developers.google.com/digital-asset-links/tools/generator>.

## Build in locale (facoltativa)

Con Android Studio: **Open** → cartella `android/` (Android Studio scarica Gradle e l'SDK).
Da riga di comando, con Gradle 8.14 e Android SDK installati: `gradle -p android assembleDebug`.
