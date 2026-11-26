/**
 * Italian UI text. This file is the SOURCE OF TRUTH for the shape of all translations:
 * other languages (en.ts) must provide exactly the same keys, or type checking fails.
 * To add a text: add it here, then in every other language file.
 *
 * Accessibility: texts used as labels for screen readers live here too (no hard-coded
 * aria-label strings in components).
 */
import type { PlaylistKind } from '../domain/types.ts';

const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);
const thousands = (n: number) => n.toLocaleString('it-IT');

export const it = {
  locale: 'it-IT',

  nav: {
    library: 'Libreria',
    nowPlaying: 'In riproduzione',
    settings: 'Impostazioni',
    mainNavigation: 'Navigazione principale',
    skipToContent: 'Vai al contenuto principale',
  },

  library: {
    title: 'Libreria',
    greeting: (hour: number): string =>
      hour < 5
        ? 'Buonanotte'
        : hour < 13
          ? 'Buongiorno'
          : hour < 18
            ? 'Buon pomeriggio'
            : 'Buonasera',
    heroSubtitle: (playlists: number, tracks: number) =>
      `${plural(playlists, 'playlist', 'playlist')} · ${tracks === 1 ? '1 brano' : `${thousands(tracks)} brani`} da ascoltare`,
    searchPlaceholder: 'Cerca playlist…',
    filterLabel: 'Tipo di playlist',
    filterAll: 'Tutte',
    filterMusic: 'Musica',
    filterVideo: 'Video',
    sortLabel: 'Ordina per',
    sortDefault: 'Ordine del canale',
    sortTitle: 'Nome',
    sortSize: 'Più brani',
    sortRecent: 'Aggiornate di recente',
    sectionAccount: 'Il tuo account',
    sectionCatalog: (channel: string) => `Dal canale ${channel}`,
    sectionManual: 'Aggiunte da te',
    resultsCount: (n: number) =>
      n === 1 ? '1 playlist trovata' : `${thousands(n)} playlist trovate`,
    noResults: 'Nessuna playlist corrisponde ai filtri.',
    catalogError: 'Impossibile caricare le playlist del canale.',
    accountError: 'Impossibile caricare le playlist del tuo account.',
    accountSignedOutHint:
      'Collega il tuo account Google per vedere anche le playlist private e i video che ti piacciono.',
    accountExpiredHint: 'La sessione Google è scaduta: basta un clic per riconnetterti.',
    signIn: 'Accedi con Google',
    reconnect: 'Riconnetti',
    addPlaylist: 'Aggiungi playlist',
    manualEmptyHint: 'Puoi aggiungere qualsiasi playlist pubblica incollandone il link.',
    likedVideos: 'Video che ti piacciono',
    catalogUpdated: 'Libreria aggiornata con le ultime modifiche del canale.',
    itemCount: (n: number, kind: PlaylistKind) =>
      kind === 'music' ? plural(n, 'brano', 'brani') : plural(n, 'video', 'video'),
    playlistsCount: (n: number) => plural(n, 'playlist', 'playlist'),
  },

  addPlaylist: {
    title: 'Aggiungi una playlist',
    description:
      'Incolla il link di una playlist di YouTube o YouTube Music. Deve essere pubblica o non in elenco.',
    fieldLabel: 'Link della playlist',
    placeholder: 'https://www.youtube.com/playlist?list=…',
    submit: 'Aggiungi',
    checking: 'Verifico…',
    invalidLink: 'Link non valido: deve contenere il parametro "list=".',
    notFound: 'Playlist non trovata, oppure è privata.',
    added: (title: string) => `Aggiunta "${title}"`,
  },

  playlist: {
    play: 'Riproduci',
    playNamed: (title: string) => `Riproduci ${title}`,
    shuffle: 'Casuale',
    openOnYouTube: 'Apri su YouTube',
    searchPlaceholder: 'Cerca in questa playlist…',
    kindLabel: 'Mostra come',
    kindAuto: 'Automatico',
    kindMusic: 'Musica',
    kindVideo: 'Video',
    loading: 'Caricamento della playlist…',
    loadError: 'Impossibile caricare la playlist.',
    emptyOrPrivate: 'La playlist è vuota oppure privata.',
    notFound: 'Playlist non trovata.',
    back: 'Torna alla libreria',
    remove: 'Rimuovi dalla libreria',
    tracksHeading: 'Brani',
    noTrackResults: 'Nessun brano corrisponde alla ricerca.',
    unplayable: 'Non riproducibile',
    nowPlaying: 'In riproduzione',
    updatedOn: (date: string) => `Aggiornata il ${date}`,
    signedOutLimit: 'Senza accesso Google vengono letti al massimo 200 elementi e senza durata.',
  },

  player: {
    region: 'Lettore',
    nothingPlaying: 'Niente in riproduzione',
    pickSomething: 'Scegli una playlist e premi Riproduci.',
    play: 'Riproduci',
    pause: 'Pausa',
    next: 'Successivo',
    previous: 'Precedente',
    shuffle: 'Riproduzione casuale',
    repeatOff: 'Ripeti: disattivato',
    repeatAll: 'Ripeti: tutta la coda',
    repeatOne: 'Ripeti: brano corrente',
    mute: 'Disattiva audio',
    unmute: 'Riattiva audio',
    volume: 'Volume',
    volumeValue: (n: number) => `${n}%`,
    seek: 'Posizione nel brano',
    seekValue: (current: string, total: string) => `${current} di ${total}`,
    fullscreen: 'Schermo intero',
    upNext: 'Prossimi',
    from: (title: string) => `Da: ${title}`,
    clearQueue: 'Svuota coda',
    queueEnd: 'Fine della coda',
    moreInQueue: (n: number) => (n === 1 ? 'e un altro brano' : `e altri ${thousands(n)} brani`),
    errorSkipping: 'Questo video non si può riprodurre qui: passo al successivo.',
    errorGaveUp: 'Troppi video non riproducibili di fila: riproduzione fermata.',
    openOnYouTube: 'Apri su YouTube',
    openInYouTubeMusic: 'Apri in YouTube Music',
    restoredHint: 'Premi play per riprendere da dove eri rimasto.',
    nowPlayingAnnouncement: (title: string, artist: string) =>
      artist ? `In riproduzione: ${title}, di ${artist}` : `In riproduzione: ${title}`,
    iframeTitle: (title: string) => `Video YouTube: ${title}`,
    iframeTitleIdle: 'Player YouTube',
    nativeHint:
      'Suona nel lettore dell’app: senza pubblicità, anche a schermo spento, con i comandi nella schermata di blocco.',
    openNativePlayer: 'Apri il lettore',
  },

  settings: {
    title: 'Impostazioni',
    appearance: 'Aspetto',
    language: 'Lingua',
    languageAuto: 'Automatica',
    theme: 'Tema',
    themeAuto: 'Automatico',
    themeDark: 'Notturno',
    themeLight: 'Alba',

    account: 'Account Google',
    accountIntro:
      'Facoltativo. Con l’accesso vedi anche le playlist private, quelle non in elenco e i video che ti piacciono. Accesso in sola lettura: l’app non può modificare nulla.',
    signedInAs: (name: string) => `Connesso come ${name}`,
    signedIn: 'Connesso',
    signIn: 'Accedi con Google',
    signOut: 'Esci',
    signingIn: 'Accesso in corso…',
    expired: 'Sessione scaduta: premi Accedi per riconnetterti.',
    signInError: (message: string) => `Accesso non riuscito: ${message}`,
    notConfigured:
      'L’accesso con Google non è ancora attivo in questa versione dell’app. Le playlist pubbliche del canale funzionano comunque.',
    setupGuide: 'Come si attiva (per chi gestisce l’app)',
    clientIdLabel: 'OAuth Client ID (avanzato)',
    clientIdHelp: 'Lascia vuoto per usare quello del progetto.',
    save: 'Salva',

    listening: 'Pubblicità e ascolto in background',
    listeningWeb:
      'In un browser una pagina può usare solo il player di YouTube: con le sue pubblicità e solo finché la pagina è visibile. Le app per Android e per Windows hanno un lettore proprio, senza pubblicità, che continua a suonare a schermo spento o con la finestra ridotta a icona.',
    downloadApps: 'Scarica le app (Android e Windows)',
    listeningPremium:
      'Con il player di YouTube le pubblicità spariscono solo con YouTube Premium, se hai fatto l’accesso a YouTube con lo stesso account in questo browser.',
    signInYouTube: 'Accedi a YouTube in questo browser',
    playbackMode: 'Lettore',
    playbackAdFree: 'Senza pubblicità',
    playbackYouTube: 'Player di YouTube',
    playbackHelpAndroid:
      'Senza pubblicità: niente annunci, continua a schermo spento, comandi nella schermata di blocco e nelle cuffie Bluetooth. Se un giorno non funziona (YouTube cambia spesso), scegli “Player di YouTube” finché non esce una nuova versione dell’app.',
    playbackHelpDesktop:
      'Senza pubblicità: niente annunci, continua con la finestra ridotta a icona, tasti multimediali e comandi di Windows. Il componente che legge YouTube (yt-dlp) si aggiorna da solo; se un giorno non funziona, scegli “Player di YouTube”.',
    playbackPending: 'Il nuovo lettore si attiva dopo aver ricaricato l’app.',
    playbackApply: 'Ricarica e applica',

    shortcuts: 'Scorciatoie da tastiera',
    shortcutsToggle: 'Attiva le scorciatoie a un tasto',
    shortcutsHelp:
      'Funzionano quando non stai scrivendo in un campo. Disattivale se usi un software di controllo vocale o se le premi per sbaglio.',
    shortcutList: [
      ['Spazio / K', 'Play o pausa'],
      ['J / L', 'Indietro / avanti di 10 secondi'],
      ['N / P', 'Brano successivo / precedente'],
      ['M', 'Audio sì / no'],
      ['S', 'Riproduzione casuale'],
      ['R', 'Modalità ripeti'],
    ] as [string, string][],

    library: 'Libreria',
    manualPlaylists: 'Playlist aggiunte da te',
    noManualPlaylists: 'Nessuna playlist aggiunta.',
    remove: 'Rimuovi',
    removeNamed: (title: string) => `Rimuovi ${title}`,
    kindOverrides: (n: number) =>
      n === 1 ? '1 playlist con tipo scelto a mano' : `${n} playlist con tipo scelto a mano`,
    resetKinds: 'Ripristina tipo automatico',
    catalogGenerated: (date: string) => `Catalogo del canale aggiornato: ${date}`,
    catalogAutoUpdate:
      'Il catalogo si aggiorna da solo: ogni 15 minuti si controlla se le playlist pubbliche del canale sono cambiate.',
    checkNow: 'Controlla ora',
    checking: 'Controllo…',
    catalogUpToDate: 'Il catalogo è già aggiornato.',

    install: 'Installa l’app',
    installButton: 'Installa',
    installed: 'L’app è installata su questo dispositivo.',
    installWindows:
      'Windows: scarica e apri playlist-player-setup.exe dalla pagina Releases (lettore senza pubblicità). In alternativa: Edge o Chrome → menu ⋯ → "Installa questo sito come app".',
    installAndroid:
      'Android: scarica e installa l’APK dalla pagina Releases (lettore senza pubblicità, anche a schermo spento).',
    releasesLink: 'Pagina Releases (app Android e Windows)',
    runningDesktop: (version: string) => `Stai usando l’app per Windows, versione ${version}.`,
    runningAndroid: 'Stai usando l’app per Android.',

    about: 'Informazioni',
    version: (version: string, date: string) => `Versione ${version} · build del ${date}`,
    sourceCode: 'Codice sorgente su GitHub',
    accessibility: 'Dichiarazione di accessibilità',
    disclaimer:
      'App non ufficiale, non affiliata a YouTube o Google. I contenuti restano su YouTube: l’app non scarica né conserva video.',
    clearData: 'Cancella dati locali',
    clearDataConfirm:
      'Cancellare impostazioni, coda e playlist aggiunte su questo dispositivo? L’operazione non si può annullare.',
  },

  common: {
    retry: 'Riprova',
    cancel: 'Annulla',
    close: 'Chiudi',
    dismiss: 'Chiudi notifica',
    clearSearch: 'Cancella ricerca',
    loading: 'Caricamento…',
    offline: 'Sei offline: alcune funzioni non sono disponibili.',
    opensInNewTab: '(si apre in una nuova scheda)',
  },
};

export type Strings = typeof it;
