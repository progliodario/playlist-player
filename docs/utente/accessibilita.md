# Dichiarazione di accessibilità

Playlist Player punta alla conformità con le **WCAG 2.2 livello AA**.

## Cosa è supportato

- **Tastiera**: tutto si usa senza mouse. Il primo `Tab` porta a "Vai al contenuto principale";
  i gruppi di opzioni si usano con le frecce; dopo ogni cambio di pagina il focus va al titolo
  della nuova pagina. Il focus è sempre visibile (bordo giallo nel tema scuro, viola in quello
  chiaro).
- **Lettori di schermo** (NVDA, JAWS, VoiceOver, TalkBack): pagine con regioni (navigazione,
  contenuto, lettore), titoli in ordine, pulsanti con nomi chiari ("Riproduci sangiovanni"),
  annuncio del brano che inizia, dei risultati di ricerca e delle notifiche. Il player video ha
  un titolo ("Video YouTube: …").
- **Contrasto**: testi almeno 4,5:1 e indicatori almeno 3:1, in entrambi i temi (verificato
  automaticamente a ogni modifica).
- **Testo e zoom**: dimensioni in unità relative; l'app si adatta fino a 320 px di larghezza
  (zoom 400%) senza scorrimento orizzontale.
- **Preferenze di sistema rispettate**: riduzione del movimento (niente animazioni), riduzione
  della trasparenza, contrasto elevato, contrasto elevato di Windows, tema chiaro/scuro.
- **Bersagli** dei comandi principali di almeno 44×44 px.
- **Scorciatoie a un tasto** disattivabili (Impostazioni → Scorciatoie da tastiera).
- **Notifiche**: gli errori restano finché non li chiudi; le altre si fermano se ci passi sopra
  con il mouse o con il focus.

## Limiti noti

- Il **contenuto dei video** (sottotitoli, audiodescrizione) dipende da YouTube e dal player
  ufficiale.
- Le **pubblicità** sono gestite da YouTube e possono non essere accessibili.
- Le illustrazioni decorative non hanno descrizione testuale perché non portano informazioni.

## Segnalare un problema

Apri una segnalazione su <https://github.com/progliodario/playlist-player/issues> descrivendo
dispositivo, browser, eventuale tecnologia assistiva e cosa non funziona.

Ultima verifica: 26 novembre 2026 (axe-core su tutte le pagine, entrambi i temi, desktop e
telefono; navigazione da tastiera).
