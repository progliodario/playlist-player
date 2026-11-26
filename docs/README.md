# Documentazione

Tre cartelle, una per pubblico. Ogni file è autonomo e inizia con un riassunto.

## `utente/` — per chi usa l'app

| File                                                | Contenuto                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| [installazione.md](utente/installazione.md)         | Installare l'app su Windows e Android                                       |
| [guida.md](utente/guida.md)                         | Come si usa: libreria, playlist, lettore, impostazioni, scorciatoie         |
| [domande-frequenti.md](utente/domande-frequenti.md) | Pubblicità, schermo spento, nuove playlist, account Google, problemi comuni |
| [accessibilita.md](utente/accessibilita.md)         | Dichiarazione di accessibilità                                              |

## `sviluppo/` — per chi modifica il codice (persone e agenti AI)

Prima di tutto leggi [AGENTS.md](../AGENTS.md) nella radice del progetto.

| File                                                | Contenuto                                                     |
| --------------------------------------------------- | ------------------------------------------------------------- |
| [architettura.md](sviluppo/architettura.md)         | Strati del codice, stato, flusso dei dati, layout, PWA        |
| [sorgenti-dati.md](sviluppo/sorgenti-dati.md)       | Da dove arrivano le playlist; catalogo e suo aggiornamento    |
| [lettore.md](sviluppo/lettore.md)                   | Come funziona la riproduzione (coda, eventi YouTube, errori)  |
| [grafica.md](sviluppo/grafica.md)                   | Tema "Notturno"/"Alba", token, illustrazioni, regole di stile |
| [accessibilita.md](sviluppo/accessibilita.md)       | Regole di accessibilità del codice e verifica manuale         |
| [regole-youtube.md](sviluppo/regole-youtube.md)     | Vincoli imposti da YouTube (da non rimuovere)                 |
| [account-google.md](sviluppo/account-google.md)     | Attivare l'accesso con Google (configurazione una tantum)     |
| [deploy-e-rilasci.md](sviluppo/deploy-e-rilasci.md) | GitHub Actions, GitHub Pages, versioni e Release              |
| [android.md](sviluppo/android.md)                   | App Android (Trusted Web Activity), firma, APK                |

## `decisioni/` — perché il progetto è fatto così

Un file per decisione, numerati: [decisioni/README.md](decisioni/README.md).

## Convenzioni della documentazione

- Lingua: italiano. Codice, nomi e commenti nel codice: inglese.
- Nomi dei file: minuscolo, parole separate da trattini.
- Quando cambi un comportamento, aggiorna il file che lo descrive **nello stesso commit**.
- Quando prendi una decisione che qualcuno potrebbe mettere in dubbio, aggiungi un file in
  `decisioni/` (prossimo numero libero) e la riga nel suo indice.
