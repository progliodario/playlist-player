# App Android

**In breve**: l'APK ha due parti. Una **Trusted Web Activity** apre il sito in Chrome a schermo
intero (interfaccia, libreria, accesso con Google). Un **lettore nativo** riceve la coda dalla
pagina e suona senza pubblicità, anche a schermo spento. Si pubblica con un tag `vX.Y.Z`; la firma
sta nei GitHub Secrets.

## Come funziona

**1. La web app (TWA).** Un piccolo launcher (libreria ufficiale
[android-browser-helper](https://github.com/GoogleChrome/android-browser-helper)) apre
`app.config.json → publicUrl?shell=android` dentro **Chrome**, a schermo intero, con icona e splash
propri. Ogni deploy del sito aggiorna anche l'interfaccia dell'app. Il login Google funziona come in
Chrome ([decisione 0001](../decisioni/0001-pwa-e-twa.md)). Requisito: Google Chrome (o un altro
browser compatibile con TWA); senza, l'app apre una Custom Tab.

**2. Il lettore nativo** ([decisione 0015](../decisioni/0015-lettori-senza-pubblicita.md)).
Grazie a `?shell=android` la pagina sa di essere nell'app (`src/platform/shell.ts`) e quando
premi play apre `intent://play/#Intent;scheme=playlistplayer;package=…;S.payload=<coda JSON>;end`
(`src/platform/android-player.ts`, formato in `src/domain/handoff-payload.ts`). Chrome apre
`PlayerActivity`, che passa la coda a `PlaybackService`:

- **Media3** (`MediaSessionService` + ExoPlayer): suona in un servizio in primo piano, quindi
  continua a schermo spento o con un'altra app aperta; comandi in notifica, schermata di blocco,
  cuffie e auto Bluetooth; pausa automatica se si staccano le cuffie.
- **NewPipeExtractor** (`StreamResolver.kt`): trova l'audio di ogni video al momento di suonarlo
  (URI `yt://youtube/<id>/audio`); nessun player di YouTube, quindi nessuna pubblicità. Il brano
  successivo viene preparato in anticipo; gli URL scaduti vengono richiesti di nuovo.
- **Video**: per le playlist "video" la schermata mostra il filmato (HLS) finché è visibile; a
  schermo spento il servizio passa al solo audio (meno dati). Pulsante "Mostra il video".
- La coda è salvata (`QueueStore.kt`) e torna, in pausa, alla riapertura.
- Errori: video non riproducibile → salto al successivo (al massimo 5 di fila).

Lato pagina, dentro l'app il pannello del lettore mostra "Apri il lettore" invece dei comandi web
(`NativePlayerNotice.tsx`). Impostazioni → Lettore → "Player di YouTube" torna al player web.

## File

| File                                                       | Contenuto                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| `android/app/build.gradle`                                 | Identità da `app.config.json`, dipendenze                          |
| `android/app/src/main/AndroidManifest.xml`                 | Launcher TWA, link verificati, `PlayerActivity`, `PlaybackService` |
| `android/app/src/main/java/.../player/Handoff.kt`          | Formato della coda (uguale a `src/domain/handoff-payload.ts`)      |
| `android/app/src/main/java/.../player/PlaybackService.kt`  | Lettore: coda, video sì/no, errori, salvataggio                    |
| `android/app/src/main/java/.../player/StreamResolver.kt`   | NewPipeExtractor: URL dell'audio e manifest HLS, con cache         |
| `android/app/src/main/java/.../player/PlayerActivity.kt`   | Schermata: riceve la coda dalla pagina, comanda il servizio        |
| `android/app/src/main/java/.../player/ui/PlayerScreen.kt`  | Interfaccia Compose (accessibile, tema "Notturno")                 |
| `android/app/src/main/res/values*/strings.xml`             | Testi del lettore nativo (italiano, inglese)                       |
| `android/app/src/test/.../HandoffJsonTest.kt`              | Test del formato della coda (in CI)                                |
| `android/app/src/main/res/mipmap-*`, `drawable/splash.png` | Icone generate da `npm run icons`                                  |
| `android/build.gradle`                                     | Versioni di Android Gradle Plugin e Kotlin                         |
| `.github/workflows/android.yml`                            | Test, build in CI e pubblicazione della Release                    |

Versioni: Android Gradle Plugin 9.5.3 (con Kotlin integrato), Kotlin 2.4.21, Gradle 9.9.2, JDK 17,
compileSdk 37.1, targetSdk 36, minSdk 24 (Android 7.0 o successivo). Media3 1.11.1, Compose BOM
2026.11.01, OkHttp 5.5.1, NewPipeExtractor v0.27.1 ([decisione 0010](../decisioni/0010-versione-agp.md)).

**Licenza**: NewPipeExtractor è GPL-3.0, quindi l'APK e la cartella `android/` sono distribuiti con
licenza GPL-3.0-or-later (`android/LICENSE`). Il resto del repository è MIT.

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
impostazioni locali), e aggiorna l'impronta in `assetlinks.json` (sezione sotto).

**Copia di sicurezza**: i GitHub Secrets si possono sovrascrivere ma non rileggere. Conserva il file
`.jks` e le password fuori dal repository (gestore di password o archivio cifrato). Una copia
locale, mai committata, sta in `.signing/` (in `.gitignore`).

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
[`progliodario/progliodario.github.io`](https://github.com/progliodario/progliodario.github.io).
Senza, l'app funziona ugualmente ma con una sottile barra con l'indirizzo in alto.

**Stato: attivo dalla 1.2.0.** Il file è
<https://progliodario.github.io/.well-known/assetlinks.json>. Ogni build dell'APK firmata lo
controlla (passo _Check Digital Asset Links_ del workflow) e mostra un avviso se l'impronta della
chiave non c'è.

Va aggiornato solo se cambi la chiave di firma o `android.applicationId`: modifica il file
nel repository `progliodario.github.io` (il suo README spiega come). Per ricrearlo da zero:

1. Copia l'impronta **SHA-256** del certificato dal riepilogo dell'ultimo run del workflow
   **Android APK** (sezione "Signing certificate"), in maiuscolo con `:` ogni due caratteri.
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
Da riga di comando, con JDK 17-21, Gradle 9.6 o successivo e Android SDK (piattaforma 37.1):
`gradle -p android testDebugUnitTest assembleDebug`. Non serve per pubblicare: lo fa la CI.
