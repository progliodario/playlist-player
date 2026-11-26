# Sorgenti delle playlist

L'app mostra le playlist in tre sezioni, una per sorgente. Tutte implementano la stessa
interfaccia (`src/sources/types.ts`):

```ts
interface PlaylistSource {
  kind: 'catalog' | 'account' | 'manual';
  isAvailable(): boolean;
  listPlaylists(): Promise<PlaylistSummary[]>;
  getPlaylist(id: string): Promise<Playlist>;
}
```

Ogni playlist ha una chiave unica `sorgente:id` (es. `catalog:PLTM-XG-H2IL4`), usata negli URL
(`#/playlist/catalog%3APLTM-XG-H2IL4`) e per le preferenze (tipo musica/video scelto a mano).

## 1. `catalog` — playlist pubbliche del canale (senza login)

- **Cosa**: tutte le playlist pubbliche del canale `app.config.json → youtube.channelHandle`,
  più `extraPlaylistIds`, meno `excludedPlaylistIds`.
- **Come**: `scripts/build-catalog.ts` usa **yt-dlp** in modalità `--flat-playlist` (legge solo
  titoli, durate e id; non scarica nulla) e scrive file JSON statici pubblicati con il sito.
- **Quando**: a ogni deploy (push su `main`) e ogni giorno alle 03:23 UTC (`.github/workflows/deploy.yml`).
- **Se YouTube blocca la CI**: lo script riusa il catalogo già pubblicato (`--fallback-to-published`),
  così il sito non si rompe; il catalogo resta solo meno aggiornato.

Formato dei file (`src/sources/catalog/catalog-schema.ts`):

```
catalog/index.json                 { schemaVersion, generatedAt, channel, playlists: [...] }
catalog/playlists/<id>.json        { schemaVersion, id, title, tracks: [{ videoId, title, channelTitle, durationSeconds }] }
```

Se cambi il formato aumenta `CATALOG_SCHEMA_VERSION` e aggiorna sia lo script sia `catalog-source.ts`.

## 2. `account` — account Google (facoltativo)

- **Cosa**: playlist dell'utente collegato, **comprese private e non in elenco**, più "Video che
  ti piacciono" (playlist `LL`).
- **Come**: login con Google Identity Services (token client, scope
  `youtube.readonly`, nessun backend) e chiamate dirette alla YouTube Data API v3
  (`src/sources/account/youtube-data-api.ts`).
- **Requisito**: un OAuth Client ID → [GOOGLE-OAUTH-SETUP.md](GOOGLE-OAUTH-SETUP.md). Finché
  `google.oauthClientId` è vuoto la sezione non compare.
- **Token**: dura al massimo 1 ora; resta in `localStorage` fino alla scadenza, poi l'app mostra
  "Riconnetti". Uscire revoca il token.
- **Quota**: ogni chiamata costa 1 unità su 10.000 giornaliere; una playlist di 300 brani ≈ 12 unità.

## 3. `manual` — playlist aggiunte con un link

- **Cosa**: qualsiasi playlist pubblica o non in elenco (anche di altri canali, anche link di
  YouTube Music). Elenco salvato nel browser (`useSettingsStore.manualPlaylists`).
- **Come, senza login**: titolo della playlist via **oEmbed** (`youtube.com/oembed`, permette
  richieste da altri siti); id dei video con un **player YouTube temporaneo e invisibile** che
  "mette in coda" la playlist e legge `getPlaylist()` (limite del player: ~200 video); titoli dei
  video via oEmbed, salvati in cache in `localStorage`.
- **Come, con login**: Data API (nessun limite, con durate).

## Musica o video?

`src/domain/classify.ts` assegna a ogni brano un punteggio:

| Segnale                                                                              | Punteggio |
| ------------------------------------------------------------------------------------ | --------- |
| Canale "… - Topic" o "…VEVO", oppure titolo con "Official Video", "Lyrics", "feat."… | 1         |
| Durata tra 1 e 8 minuti                                                              | 0,6       |
| Altro                                                                                | 0         |

La playlist è **musica** se la media (+0,15 se il titolo della playlist contiene "music",
"canzoni", "hits"…) è ≥ 0,55. L'utente può forzare il tipo dalla pagina della playlist ("Mostra
come"); il manutentore può forzarlo per il catalogo in `app.config.json → youtube.kindOverrides`.

## Cosa NON è possibile (limiti delle API di YouTube)

- Playlist **salvate** da altri utenti nella propria libreria: l'API non le elenca → aggiungerle
  con il link.
- "Mi piace" di **YouTube Music** (`LM`) e "Guarda più tardi" (`WL`): non accessibili dall'API.
- Riprodurre video che il proprietario non permette di incorporare: vengono saltati.
