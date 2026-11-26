# Playlist Player

App per **Windows e Android** che mostra e riproduce le playlist YouTube del canale
[@DarioProglio](https://www.youtube.com/@DarioProglio): **canzoni** e **video**, con una grafica
illustrata ("Notturno": cielo di notte, aurora, vinili) e accessibilità completa.

**Apri l'app → https://progliodario.github.io/playlist-player/**

## Installazione

| Dispositivo | Come                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Windows** | Apri il link con **Edge** o **Chrome** → menu `⋯` → **Installa questo sito come app**. Compare nel menu Start come un'app normale.                                             |
| **Android** | Scarica l'APK dall'ultima [Release](https://github.com/progliodario/playlist-player/releases/latest) e installalo (serve Chrome). Oppure Chrome → menu `⋮` → **Installa app**. |

Dettagli: [docs/utente/installazione.md](docs/utente/installazione.md).

## Cosa fa

- **Playlist del canale senza login**, sempre aggiornate: una playlist nuova o modificata su
  YouTube compare nell'app entro ~15-20 minuti, anche con l'app aperta.
- **Musica e video**: ogni playlist è riconosciuta come musica o video (modificabile); le
  musicali sono custodie di disco con il vinile, le video hanno la cornice a pellicola.
- **Lettore completo**: casuale, ripeti, avanzamento, volume, schermo intero, coda, ripresa da
  dove eri rimasto, scorciatoie da tastiera, "Apri in YouTube Music".
- **Aggiungi qualsiasi playlist pubblica** con il suo link (anche YouTube Music).
- **Account Google (facoltativo)**: playlist private e video piaciuti, con un clic su "Accedi con
  Google" ([configurazione](docs/sviluppo/account-google.md)).
- **Accessibile** (WCAG 2.2 AA): tastiera, lettori di schermo, contrasti verificati, movimento
  ridotto, contrasto elevato — [dichiarazione](docs/utente/accessibilita.md).
- Temi **Notturno** e **Alba**, italiano e inglese, installabile e utilizzabile offline (PWA).

Guida all'uso: [docs/utente/guida.md](docs/utente/guida.md).

## Pubblicità e schermo spento

L'app usa il player ufficiale di YouTube e rispetta le sue regole, che vietano di bloccare le
pubblicità e di riprodurre con il player nascosto. Con **YouTube Premium** le pubblicità spariscono
anche qui (basta l'accesso a YouTube nello stesso browser) e il pulsante **Apri in YouTube Music**
continua l'ascolto a schermo spento nell'app ufficiale.
Dettagli: [docs/utente/domande-frequenti.md](docs/utente/domande-frequenti.md).

## Per sviluppatori e agenti AI

```powershell
npm install
npm run dev
```

```powershell
npm run check
```

Prima di modificare il codice leggi **[AGENTS.md](AGENTS.md)** (mappa, regole, ricette) e l'indice
della documentazione **[docs/README.md](docs/README.md)**. Storia delle versioni:
[CHANGELOG.md](CHANGELOG.md).

## Licenza

[MIT](LICENSE). App non ufficiale, non affiliata a YouTube o Google.
