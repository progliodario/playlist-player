# Sorgenti delle playlist

**In breve**: tre sorgenti con la stessa interfaccia. Il **catalogo** (playlist pubbliche del
canale) è generato in CI e si aggiorna entro ~15 minuti da ogni modifica su YouTube; l'**account**
Google è facoltativo; le playlist **aggiunte con un link** restano nel browser.

```ts
// src/sources/types.ts
interface PlaylistSource {
  kind: 'catalog' | 'account' | 'manual';
  isAvailable(): boolean;
  listPlaylists(): Promise<PlaylistSummary[]>;
  getPlaylist(id: string): Promise<Playlist>;
}
```

Ogni playlist ha una chiave unica `sorgente:id` (es. `catalog:PLTM-XG-H2IL4`), usata negli URL
(`#/playlist/catalog%3APLTM-XG-H2IL4`), per le preferenze e per il colore (`hueFromString`).

## 1. `catalog` — playlist pubbliche del canale (senza login)

- **Cosa**: le playlist pubbliche di `app.config.json → youtube.channelHandle`, più
  `extraPlaylistIds`, meno `excludedPlaylistIds`.
- **Come**: `scripts/build-catalog.ts` usa **yt-dlp** con `--flat-playlist` (solo titoli, durate,
  id; non scarica nulla) e scrive JSON statici pubblicati con il sito.
- **Formato** (`src/sources/catalog/catalog-schema.ts`):

  ```
  catalog/index.json            { schemaVersion, generatedAt, contentHash, channel, playlists: [...] }
  catalog/playlists/<id>.json   { schemaVersion, id, title, tracks: [{ videoId, title, channelTitle, durationSeconds }] }
  ```

  Se cambi il formato aumenta `CATALOG_SCHEMA_VERSION` e aggiorna script e `catalog-source.ts`.

### Aggiornamento automatico

```
ogni 15 min (GitHub Actions)          app aperta (ogni 5 min, al ritorno in primo piano)
  build-catalog.ts  ──► contentHash     fetch index.json ──► versione diversa?
  catalog-changed.ts: diverso dall'online?        └─ sì: ricarica la libreria senza sfarfallio,
     └─ sì: build + deploy su Pages                    dimentica i brani in cache, "Libreria aggiornata"
     └─ no: fine (nessun deploy)
```

- `contentHash` = SHA-256 di playlist, ordine e brani (non della data): stesse playlist → stesso
  hash, quindi nessun deploy inutile.
- Se YouTube rifiuta le richieste dalla CI, lo script riusa il catalogo online
  (`--fallback-to-published`): il sito non si rompe, resta solo meno aggiornato.
- Il service worker usa _network first_ per il catalogo: online non si vede mai una copia vecchia.
- Pulsante manuale: **Impostazioni → Controlla ora** (`refreshCatalogIfChanged()` nel library store).

## 2. `account` — account Google (facoltativo)

- **Cosa**: playlist dell'utente collegato, comprese private e non in elenco, più "Video che ti
  piacciono" (`LL`).
- **Come**: Google Identity Services (token client, scope `youtube.readonly`, nessun backend) e
  YouTube Data API v3 (`src/sources/account/youtube-data-api.ts`).
- **Requisito**: un OAuth Client ID → [account-google.md](account-google.md). Senza, la sezione
  non compare.
- **Token**: max 1 ora, poi "Riconnetti" (un clic). Uscire revoca il token.
- **Quota**: 1 unità per chiamata su 10.000 al giorno; una playlist di 300 brani ≈ 12 unità.

## 3. `manual` — playlist aggiunte con un link

- **Cosa**: qualsiasi playlist pubblica o non in elenco (anche YouTube Music). Elenco in
  `useSettingsStore.manualPlaylists`.
- **Senza login**: titolo via **oEmbed**; id dei video con un player YouTube temporaneo e
  invisibile che legge `getPlaylist()` (max ~200 video); titoli dei video via oEmbed con cache.
- **Con login**: Data API (nessun limite, con durate).

## Musica o video?

`src/domain/classify.ts` dà a ogni brano un punteggio:

| Segnale                                                                              | Punteggio |
| ------------------------------------------------------------------------------------ | --------- |
| Canale "… - Topic" o "…VEVO", oppure titolo con "Official Video", "Lyrics", "feat."… | 1         |
| Durata tra 1 e 8 minuti                                                              | 0,6       |
| Altro                                                                                | 0         |

È **musica** se la media (+0,15 se il titolo contiene "music", "canzoni", "hits"…) è ≥ 0,55.
L'utente può cambiare tipo ("Mostra come"); per il catalogo si può forzare in
`app.config.json → youtube.kindOverrides`.

## Limiti delle API di YouTube

- Playlist **salvate** da altri utenti: non elencabili → aggiungerle con il link.
- "Mi piace" di **YouTube Music** (`LM`) e "Guarda più tardi" (`WL`): non accessibili.
- Video con incorporamento vietato: vengono saltati.
