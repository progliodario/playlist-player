/**
 * Italian UI text. This file is the SOURCE OF TRUTH for the shape of all translations:
 * other languages (en.ts) must provide exactly the same keys, or type checking fails.
 * To add a text: add it here, then in every other language file.
 */
import type { PlaylistKind } from '../domain/types.ts';

const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);

export const it = {
  locale: 'it-IT',

  nav: {
    library: 'Libreria',
    nowPlaying: 'In riproduzione',
    settings: 'Impostazioni',
    mainNavigation: 'Navigazione principale',
  },

  library: {
    title: 'Libreria',
    searchPlaceholder: 'Cerca playlist…',
    filterAll: 'Tutte',
    filterMusic: 'Musica',
    filterVideo: 'Video',
    sortLabel: 'Ordina',
    sortDefault: 'Predefinito',
    sortTitle: 'Nome',
    sortSize: 'Più brani',
    sortRecent: 'Aggiornate di recente',
    sectionAccount: 'Il tuo account',
    sectionCatalog: (channel: string) => `Dal canale ${channel}`,
    sectionManual: 'Aggiunte da te',
    noResults: 'Nessuna playlist corrisponde ai filtri.',
    catalogError: 'Impossibile caricare le playlist del canale.',
    accountError: 'Impossibile caricare le playlist del tuo account.',
    accountSignedOutHint:
      'Accedi con Google per vedere anche le playlist private e i video che ti piacciono.',
    accountExpiredHint: 'La sessione Google è scaduta.',
    signIn: 'Accedi con Google',
    reconnect: 'Riconnetti',
    addPlaylist: 'Aggiungi playlist',
    manualEmptyHint: 'Puoi aggiungere qualsiasi playlist pubblica incollandone il link.',
    likedVideos: 'Video che ti piacciono',
    itemCount: (n: number, kind: PlaylistKind) =>
      kind === 'music' ? plural(n, 'brano', 'brani') : plural(n, 'video', 'video'),
    playlistsCount: (n: number) => plural(n, 'playlist', 'playlist'),
  },

  addPlaylist: {
    title: 'Aggiungi una playlist',
    description:
      'Incolla il link di una playlist di YouTube o YouTube Music. Deve essere pubblica o non in elenco.',
    placeholder: 'https://www.youtube.com/playlist?list=…',
    submit: 'Aggiungi',
    checking: 'Verifico…',
    invalidLink: 'Link non valido: deve contenere il parametro "list=".',
    notFound: 'Playlist non trovata, oppure è privata.',
    added: (title: string) => `Aggiunta "${title}"`,
  },

  playlist: {
    play: 'Riproduci',
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
    noTrackResults: 'Nessun brano corrisponde alla ricerca.',
    unplayable: 'Non riproducibile',
    nowPlaying: 'In riproduzione',
    updatedOn: (date: string) => `Aggiornata il ${date}`,
    signedOutLimit: 'Senza accesso Google vengono letti al massimo 200 elementi e senza durata.',
  },

  player: {
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
    seek: 'Posizione nel brano',
    fullscreen: 'Schermo intero',
    upNext: 'Prossimi',
    from: (title: string) => `Da: ${title}`,
    clearQueue: 'Svuota coda',
    queueEnd: 'Fine della coda',
    errorSkipping: 'Questo video non si può riprodurre qui: passo al successivo.',
    errorGaveUp: 'Troppi video non riproducibili di fila: riproduzione fermata.',
    openOnYouTube: 'Apri su YouTube',
    restoredHint: 'Premi play per riprendere da dove eri rimasto.',
  },

  settings: {
    title: 'Impostazioni',
    appearance: 'Aspetto',
    language: 'Lingua',
    languageAuto: 'Automatica',
    theme: 'Tema',
    themeAuto: 'Automatico',
    themeDark: 'Scuro',
    themeLight: 'Chiaro',

    account: 'Account Google',
    accountIntro:
      'Facoltativo. Con l’accesso vedi anche le playlist private, quelle non in elenco e i video che ti piacciono. Accesso in sola lettura.',
    signedInAs: (name: string) => `Connesso come ${name}`,
    signedIn: 'Connesso',
    signIn: 'Accedi con Google',
    signOut: 'Esci',
    signingIn: 'Accesso in corso…',
    expired: 'Sessione scaduta: accedi di nuovo.',
    signInError: (message: string) => `Accesso non riuscito: ${message}`,
    notConfigured:
      'L’accesso con Google non è ancora configurato per questa app. Le playlist pubbliche del canale funzionano comunque.',
    setupGuide: 'Guida alla configurazione',
    clientIdLabel: 'OAuth Client ID (avanzato)',
    clientIdHelp: 'Lascia vuoto per usare quello del progetto.',
    save: 'Salva',

    library: 'Libreria',
    manualPlaylists: 'Playlist aggiunte da te',
    noManualPlaylists: 'Nessuna playlist aggiunta.',
    remove: 'Rimuovi',
    kindOverrides: (n: number) =>
      n === 1 ? '1 playlist con tipo scelto a mano' : `${n} playlist con tipo scelto a mano`,
    resetKinds: 'Ripristina tipo automatico',
    reloadLibrary: 'Ricarica libreria',
    catalogGenerated: (date: string) => `Catalogo del canale aggiornato il ${date}`,

    install: 'Installa l’app',
    installButton: 'Installa',
    installed: 'L’app è installata su questo dispositivo.',
    installWindows:
      'Windows: apri questa pagina con Edge o Chrome, poi menu ⋯ → "Installa questo sito come app".',
    installAndroid:
      'Android: scarica l’APK dalla pagina Releases del progetto, oppure in Chrome menu ⋮ → "Installa app".',
    releasesLink: 'Pagina Releases (APK Android)',

    about: 'Informazioni',
    version: (version: string, date: string) => `Versione ${version} · build del ${date}`,
    sourceCode: 'Codice sorgente su GitHub',
    disclaimer:
      'App non ufficiale, non affiliata a YouTube o Google. I video sono riprodotti con il player ufficiale di YouTube.',
    clearData: 'Cancella dati locali',
    clearDataConfirm:
      'Cancellare impostazioni, coda e playlist aggiunte su questo dispositivo? L’operazione non si può annullare.',
  },

  common: {
    retry: 'Riprova',
    cancel: 'Annulla',
    close: 'Chiudi',
    loading: 'Caricamento…',
    offline: 'Sei offline: alcune funzioni non sono disponibili.',
  },
};

export type Strings = typeof it;
