# App Windows

App Electron che apre il sito e aggiunge il lettore senza pubblicità (stream trovati da yt-dlp),
che continua con la finestra ridotta a icona. Guida completa:
[../docs/sviluppo/app-windows.md](../docs/sviluppo/app-windows.md).

Dalla radice del repository:

```powershell
npm run desktop:install
```

```powershell
npm run desktop:start
```

```powershell
npm run desktop:check
```

```powershell
npm run desktop:dist
```

| Dove                          | Cosa                                                                 |
| ----------------------------- | -------------------------------------------------------------------- |
| `main/`                       | Processo principale: finestra, yt-dlp, `ppstream://`, accesso Google |
| `preload.cjs`                 | Ponte verso la pagina (`window.playlistPlayerDesktop`)               |
| `electron-builder.config.cjs` | Installer `dist/playlist-player-setup.exe`                           |
| `scripts/prepare.cjs`         | Copia nome, versione e icona da `../app.config.json`                 |

Installer pubblicato dal workflow **Windows app** (`.github/workflows/desktop.yml`) a ogni tag
`vX.Y.Z`.
