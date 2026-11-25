# Playlist Player

App per **Windows e Android** che mostra e riproduce le playlist YouTube del canale
[@DarioProglio](https://www.youtube.com/@DarioProglio): sia **canzoni** sia **video**.

**Apri l'app → https://progliodario.github.io/playlist-player/**

- **Desktop**: tre colonne — menu, libreria/playlist, pannello "In riproduzione" con video e coda.
- **Telefono**: player compatto in alto (quadrato per la musica, largo per i video), navigazione in basso.

## Installazione

| Dispositivo | Come                                                                                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Windows** | Apri il link sopra con **Edge** o **Chrome** → menu `⋯` → **Installa questo sito come app** (oppure l'icona di installazione nella barra degli indirizzi). Comparirà nel menu Start come un'app normale. |
| **Android** | Scarica l'APK dall'ultima [Release](https://github.com/progliodario/playlist-player/releases/latest) e installalo. In alternativa apri il link con Chrome → menu `⋮` → **Installa app**.                 |

Guida dettagliata: [docs/INSTALL.md](docs/INSTALL.md).

## Cosa fa

- **Playlist del canale senza login**: tutte le playlist pubbliche di @DarioProglio, aggiornate
  automaticamente ogni giorno.
- **Musica e video**: ogni playlist viene riconosciuta come _musica_ o _video_ (si può cambiare a
  mano) e l'interfaccia si adatta: copertina quadrata e lista brani per la musica, player largo
  per i video.
- **Riproduzione completa**: play/pausa, successivo/precedente, casuale, ripeti (coda o brano),
  barra di avanzamento, volume, schermo intero, coda "Prossimi".
- **Riprende da dove eri**: coda e posizione vengono ricordate anche chiudendo l'app.
- **Aggiungi qualsiasi playlist** pubblica incollandone il link (anche di altri canali o di
  YouTube Music).
- **Account Google (facoltativo)**: con l'accesso si vedono anche playlist private, non in elenco
  e i video piaciuti. Richiede una configurazione una tantum: [docs/GOOGLE-OAUTH-SETUP.md](docs/GOOGLE-OAUTH-SETUP.md).
- Tema chiaro/scuro, italiano/inglese, funziona offline per la parte già visitata (PWA).

### Scorciatoie da tastiera

| Tasto          | Azione        | Tasto     | Azione                  |
| -------------- | ------------- | --------- | ----------------------- |
| `Spazio` / `K` | Play / pausa  | `N` / `P` | Successivo / precedente |
| `J` / `L`      | −10 s / +10 s | `M`       | Muto                    |
| `S`            | Casuale       | `R`       | Ripeti                  |

## Limiti noti

- I video sono riprodotti con il **player ufficiale di YouTube**, che deve restare visibile (regole
  di YouTube): niente riproduzione "solo audio" a schermo spento.
- Alcuni video non permettono la riproduzione fuori da YouTube: vengono saltati automaticamente
  e segnalati con un link per aprirli su YouTube.
- Le playlist "salvate" di altri utenti e "Mi piace" di YouTube Music non sono esposte dalle API
  di YouTube: si possono aggiungere con il link.

## Per sviluppatori (e agenti AI)

```powershell
npm install
npm run catalog   # facoltativo: scarica il catalogo playlist (serve yt-dlp)
npm run dev       # http://localhost:5173/playlist-player/
npm run check     # tipi + lint + formattazione + test
```

Da leggere prima di modificare il codice: **[AGENTS.md](AGENTS.md)** (mappa del progetto, regole,
ricette per le modifiche più comuni).

| Documento                                                | Contenuto                                               |
| -------------------------------------------------------- | ------------------------------------------------------- |
| [AGENTS.md](AGENTS.md)                                   | Guida operativa per chi modifica il codice (umani e AI) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)             | Struttura, flusso dei dati, stato, player               |
| [docs/DATA-SOURCES.md](docs/DATA-SOURCES.md)             | Da dove arrivano le playlist (catalogo, account, link)  |
| [docs/GOOGLE-OAUTH-SETUP.md](docs/GOOGLE-OAUTH-SETUP.md) | Attivare l'accesso con Google                           |
| [docs/ANDROID.md](docs/ANDROID.md)                       | App Android (TWA), firma, APK                           |
| [docs/DEPLOY.md](docs/DEPLOY.md)                         | GitHub Actions, GitHub Pages, rilasci                   |
| [docs/YOUTUBE-POLICIES.md](docs/YOUTUBE-POLICIES.md)     | Regole YouTube da rispettare                            |
| [docs/DECISIONS.md](docs/DECISIONS.md)                   | Perché il progetto è fatto così                         |
| [CHANGELOG.md](CHANGELOG.md)                             | Storia delle versioni                                   |

## Licenza

[MIT](LICENSE). App non ufficiale, non affiliata a YouTube o Google.
