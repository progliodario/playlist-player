# 0011 — Niente blocco delle pubblicità né riproduzione in background

- **Stato**: superata dalla [0015](0015-lettori-senza-pubblicita.md) (il 2026-11-26, su richiesta
  esplicita del proprietario). Vale ancora per la versione web nel browser.
- **Data**: 2026-11-26

## Contesto

È stato chiesto di togliere le pubblicità e di ascoltare a schermo spento. Le Norme per gli sviluppatori di YouTube vietano esplicitamente sia il blocco delle pubblicità sia la riproduzione in background del player; aggirarle richiederebbe di estrarre gli stream (contro i termini, fragile, con rischio di sospensione del progetto Google e di rimozione del repository).

## Decisione

L'app usa solo il player ufficiale e non forza la riproduzione nascosta. Offre le alternative lecite: YouTube Premium (con l'accesso a YouTube nello stesso browser il player non mostra pubblicità) e il pulsante "Apri in YouTube Music" per l'ascolto in background nell'app ufficiale.

## Conseguenze

Il proprietario ha poi chiesto di procedere comunque: le app Android e Windows hanno ora un lettore
proprio (decisione 0015). Nel browser restano valide le regole qui sopra.
