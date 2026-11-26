# Changelog

Tutte le modifiche rilevanti, dalla più recente. Formato ispirato a
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/), versioni [SemVer](https://semver.org/lang/it/).

## [Non rilasciato]

## [1.1.1] — 2026-11-26

### Corretto

- Gli aggiornamenti dell'app arrivano subito: prima la nuova versione restava in attesa finché
  non si chiudevano tutte le finestre dell'app. L'app aperta a lungo controlla anche ogni 30
  minuti se c'è una versione nuova.

## [1.1.0] — 2026-11-26

### Aggiunto

- Nuova grafica "Notturno" (scuro) e "Alba" (chiaro): cielo illustrato con città, onde sonore,
  note e luna/sole; aurora animata; vinili che girano; custodie di disco per la musica e cornici a
  pellicola per i video; colori diversi per ogni playlist; nuova icona dell'app.
- Il catalogo del canale si aggiorna da solo: controllo ogni 15 minuti e pubblicazione solo se le
  playlist sono cambiate; l'app aperta si aggiorna ogni 5 minuti; pulsante "Controlla ora".
- Accessibilità WCAG 2.2 AA: link "Vai al contenuto", focus al titolo dopo ogni navigazione,
  annunci per lettori di schermo (brano, risultati, notifiche), gruppi di opzioni con le frecce,
  titolo del player video, scorciatoie disattivabili, contrasto elevato, trasparenza e movimento
  ridotti, colori forzati di Windows, layout fino a 320px.
- Pulsante "Apri in YouTube Music" e spiegazione su pubblicità e ascolto a schermo spento.
- Test automatici di accessibilità (axe-core) e dei contrasti; lint di accessibilità.
- Documentazione riorganizzata in `docs/utente`, `docs/sviluppo`, `docs/decisioni`.

### Corretto

- Il pulsante play/pausa non si blocca più durante le pubblicità di YouTube.
- Nessun lampo del tema sbagliato all'apertura.

## [1.0.0] — 2026-11-26

### Aggiunto

- Libreria con le playlist pubbliche del canale @DarioProglio.
- Riconoscimento automatico musica/video, modificabile per ogni playlist.
- Player YouTube con coda, casuale, ripeti, avanzamento, volume, schermo intero, scorciatoie.
- Ripresa della riproduzione dopo la chiusura dell'app.
- Aggiunta di playlist pubbliche tramite link, anche senza login.
- Accesso facoltativo con Google per playlist private e video piaciuti.
- Layout desktop a tre colonne e layout telefono con player compatto.
- Tema chiaro/scuro, italiano/inglese, PWA installabile e utilizzabile offline.
- App Android (Trusted Web Activity) con build e Release automatiche.
- Documentazione per utenti, sviluppatori e agenti AI.
