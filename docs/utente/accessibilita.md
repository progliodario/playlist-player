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
- **Lettore dell'app Android** (schermata nativa): ogni comando ha un nome e uno stato letti da
  TalkBack (es. "Riproduzione casuale, attivato"), la posizione nel brano è letta come
  "1:23 di 3:45", il titolo del brano che cambia viene annunciato, i bersagli sono di almeno
  48×48 dp e il testo segue la dimensione dei caratteri di sistema. Gli stessi comandi sono nella
  notifica e nella schermata di blocco.
- **App Windows**: è la stessa interfaccia del sito; in più tasti multimediali e riquadro
  multimediale di Windows.

## Limiti noti

- Il **contenuto dei video** (sottotitoli, audiodescrizione) dipende da YouTube. Nei lettori senza
  pubblicità delle app i sottotitoli dei video non sono ancora mostrati.
- Nel browser le **pubblicità** sono gestite da YouTube e possono non essere accessibili.
- La schermata del lettore Android usa sempre il tema scuro "Notturno".
- Le illustrazioni decorative non hanno descrizione testuale perché non portano informazioni.

## Segnalare un problema

Apri una segnalazione su <https://github.com/progliodario/playlist-player/issues> descrivendo
dispositivo, browser, eventuale tecnologia assistiva e cosa non funziona.

Ultima verifica: 26 novembre 2026 (axe-core su tutte le pagine, entrambi i temi, desktop e
telefono; navigazione da tastiera).
