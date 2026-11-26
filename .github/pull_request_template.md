## Cosa cambia

<!-- Breve descrizione del cambiamento e del perché. -->

## Checklist

- [ ] `npm run check` passa (tipi, lint, formattazione, test, link della documentazione)
- [ ] Se tocchi `desktop/`: `npm run desktop:check` passa e l'app si apre (`npm run desktop:start`)
- [ ] Se tocchi `android/`: il workflow **Android APK** della PR è verde
- [ ] Se cambi la coda passata ad Android: `src/domain/handoff-payload.ts` e `Handoff.kt` insieme
- [ ] `npm run build` passa
- [ ] Provato nel browser (`npm run dev`) su desktop e su larghezza telefono, temi Notturno e Alba
- [ ] Provato da tastiera (vedi `docs/sviluppo/accessibilita.md`)
- [ ] Documentazione aggiornata (`README.md`, `AGENTS.md`, `docs/`) se serve
- [ ] `CHANGELOG.md` aggiornato
- [ ] Regole YouTube e decisione 0015 rispettate (`docs/sviluppo/regole-youtube.md`)
- [ ] `docs/sviluppo/stato-e-prossimi-passi.md` aggiornato se chiudi o apri un punto
