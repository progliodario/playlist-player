# App Android

Trusted Web Activity che apre il sito + lettore nativo senza pubblicità che suona a schermo spento
(Kotlin, Media3, NewPipeExtractor). Guida completa: [../docs/sviluppo/android.md](../docs/sviluppo/android.md).

| Dove                                                    | Cosa                                                   |
| ------------------------------------------------------- | ------------------------------------------------------ |
| `app/build.gradle`                                      | Identità da `../app.config.json`, versioni, firma      |
| `app/src/main/AndroidManifest.xml`                      | TWA, lettore, servizio di riproduzione                 |
| `app/src/main/java/io/github/progliodario/playlistplayer/player/` | Lettore nativo (coda, stream, schermata)   |
| `app/src/main/res/values*/strings.xml`                  | Testi del lettore (italiano, inglese)                  |
| `app/src/test/`                                         | Test unitari (`gradle -p android testDebugUnitTest`)   |

Build e APK firmato: workflow **Android APK** (`.github/workflows/android.yml`), anche sulle PR.
Licenza di questa cartella: [GPL-3.0-or-later](LICENSE) (per NewPipeExtractor).
