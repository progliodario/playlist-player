# Domande frequenti

## Come tolgo le pubblicità? Come ascolto a schermo spento?

Usa le **app per Android o per Windows**
([installazione](installazione.md)): hanno un lettore proprio che non mostra pubblicità e continua a
suonare a schermo spento (Android) o con la finestra ridotta a icona (Windows). Sul telefono i
comandi sono nella notifica, nella schermata di blocco e sulle cuffie Bluetooth; su Windows
funzionano i tasti multimediali della tastiera.

Nel **browser** non si può: una pagina web può usare solo il player di YouTube, che mostra le sue
pubblicità e si ferma quando la pagina non è visibile. Lì le pubblicità spariscono solo con
YouTube Premium (accesso a YouTube nello stesso browser).

## Il lettore dell'app salta tutti i brani o non parte

YouTube cambia spesso il modo in cui fornisce i video e ogni tanto il lettore senza pubblicità va
aggiornato:

- **Windows**: il componente che legge YouTube (yt-dlp) si aggiorna da solo una volta al giorno.
  Chiudi e riapri l'app.
- **Android**: installa l'APK più recente dalla pagina dei download.
- Nel frattempo: **Impostazioni** → **Lettore** → **Player di YouTube** → **Ricarica e applica**
  (con le pubblicità, finché non arriva la correzione).

Un singolo brano saltato invece è normale: alcuni video non sono disponibili (rimossi, privati o
bloccati nel tuo paese).

## Nell'app Android il video non si vede

Nelle playlist di video il filmato si vede mentre la schermata del lettore è aperta; per le
playlist di musica premi **Mostra il video**. A schermo spento il lettore continua con il solo audio
(consuma meno dati) e riprende il video quando torni alla schermata.

## Ho creato una playlist su YouTube: quando la vedo nell'app?

Entro circa **15-20 minuti**. Ogni 15 minuti un controllo automatico confronta le playlist
pubbliche del canale con quelle pubblicate nell'app e, se qualcosa è cambiato, aggiorna l'app.
L'app aperta controlla a sua volta ogni 5 minuti e quando torni a usarla, e mostra il messaggio
"Libreria aggiornata". Per controllare subito: **Impostazioni** → **Controlla ora**.

La playlist deve essere **pubblica**. Per quelle private serve l'accesso con Google (sotto).

## Come vedo le playlist private e i video che mi piacciono?

Serve l'accesso con Google: **Libreria** o **Impostazioni** → **Accedi con Google** (una volta sola;
poi al massimo un clic su "Riconnetti" quando la sessione scade, dopo un'ora). L'accesso è in sola
lettura: l'app può solo leggere le tue playlist, non modificarle. Nell'app per Windows l'accesso si
fa nel browser predefinito, che si apre da solo: alla fine torna all'app.

La prima volta Google mostra **"Google non ha verificato questa app"**: è normale per un'app
personale come questa. Premi **Continua**, scegli il canale se ne hai più di uno e consenti la
lettura dell'account YouTube.

Possono accedere solo gli account aggiunti come "utenti di test" da chi gestisce l'app; con un
altro account compare `access_denied` (come aggiungerne uno:
[../sviluppo/account-google.md](../sviluppo/account-google.md)).

## Non trovo una playlist salvata da un altro canale

YouTube non permette alle app di leggere le playlist "salvate" di altri utenti. Aggiungila
dalla Libreria con **Aggiungi playlist** incollandone il link.

## Un brano viene saltato

Alcuni proprietari non permettono la riproduzione dei loro video fuori da YouTube, oppure il video
è stato rimosso. L'app passa al successivo e mostra **Apri su YouTube** per guardarlo lì.

## L'app funziona offline?

Si apre e mostra le schermate già visitate, ma per riprodurre serve internet.

## Come cancello tutti i miei dati dall'app?

**Impostazioni** → **Cancella dati locali**. I dati (preferenze, coda, playlist aggiunte) stanno
solo sul tuo dispositivo.
