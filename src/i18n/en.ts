/** English UI text. Must match the shape of it.ts (the source of truth). */
import type { Strings } from './it.ts';

const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);

export const en: Strings = {
  locale: 'en-GB',

  nav: {
    library: 'Library',
    nowPlaying: 'Now playing',
    settings: 'Settings',
    mainNavigation: 'Main navigation',
  },

  library: {
    title: 'Library',
    searchPlaceholder: 'Search playlists…',
    filterAll: 'All',
    filterMusic: 'Music',
    filterVideo: 'Videos',
    sortLabel: 'Sort',
    sortDefault: 'Default',
    sortTitle: 'Name',
    sortSize: 'Most items',
    sortRecent: 'Recently updated',
    sectionAccount: 'Your account',
    sectionCatalog: (channel: string) => `From channel ${channel}`,
    sectionManual: 'Added by you',
    noResults: 'No playlist matches the filters.',
    catalogError: 'Could not load the channel playlists.',
    accountError: 'Could not load your account playlists.',
    accountSignedOutHint: 'Sign in with Google to also see private playlists and liked videos.',
    accountExpiredHint: 'Your Google session expired.',
    signIn: 'Sign in with Google',
    reconnect: 'Reconnect',
    addPlaylist: 'Add playlist',
    manualEmptyHint: 'You can add any public playlist by pasting its link.',
    likedVideos: 'Liked videos',
    itemCount: (n, kind) =>
      kind === 'music' ? plural(n, 'song', 'songs') : plural(n, 'video', 'videos'),
    playlistsCount: (n) => plural(n, 'playlist', 'playlists'),
  },

  addPlaylist: {
    title: 'Add a playlist',
    description:
      'Paste the link of a YouTube or YouTube Music playlist. It must be public or unlisted.',
    placeholder: 'https://www.youtube.com/playlist?list=…',
    submit: 'Add',
    checking: 'Checking…',
    invalidLink: 'Invalid link: it must contain the "list=" parameter.',
    notFound: 'Playlist not found, or it is private.',
    added: (title) => `Added "${title}"`,
  },

  playlist: {
    play: 'Play',
    shuffle: 'Shuffle',
    openOnYouTube: 'Open on YouTube',
    searchPlaceholder: 'Search in this playlist…',
    kindLabel: 'Show as',
    kindAuto: 'Automatic',
    kindMusic: 'Music',
    kindVideo: 'Video',
    loading: 'Loading playlist…',
    loadError: 'Could not load the playlist.',
    emptyOrPrivate: 'The playlist is empty or private.',
    notFound: 'Playlist not found.',
    back: 'Back to library',
    remove: 'Remove from library',
    noTrackResults: 'No item matches the search.',
    unplayable: 'Unplayable',
    nowPlaying: 'Now playing',
    updatedOn: (date) => `Updated on ${date}`,
    signedOutLimit: 'Without Google sign-in at most 200 items are read, without durations.',
  },

  player: {
    nothingPlaying: 'Nothing playing',
    pickSomething: 'Pick a playlist and press Play.',
    play: 'Play',
    pause: 'Pause',
    next: 'Next',
    previous: 'Previous',
    shuffle: 'Shuffle',
    repeatOff: 'Repeat: off',
    repeatAll: 'Repeat: whole queue',
    repeatOne: 'Repeat: current item',
    mute: 'Mute',
    unmute: 'Unmute',
    volume: 'Volume',
    seek: 'Position',
    fullscreen: 'Full screen',
    upNext: 'Up next',
    from: (title) => `From: ${title}`,
    clearQueue: 'Clear queue',
    queueEnd: 'End of queue',
    errorSkipping: 'This video cannot be played here: skipping to the next one.',
    errorGaveUp: 'Too many unplayable videos in a row: playback stopped.',
    openOnYouTube: 'Open on YouTube',
    restoredHint: 'Press play to resume where you left off.',
  },

  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    languageAuto: 'Automatic',
    theme: 'Theme',
    themeAuto: 'Automatic',
    themeDark: 'Dark',
    themeLight: 'Light',

    account: 'Google account',
    accountIntro:
      'Optional. When signed in you also see private and unlisted playlists and liked videos. Read-only access.',
    signedInAs: (name) => `Signed in as ${name}`,
    signedIn: 'Signed in',
    signIn: 'Sign in with Google',
    signOut: 'Sign out',
    signingIn: 'Signing in…',
    expired: 'Session expired: please sign in again.',
    signInError: (message) => `Sign-in failed: ${message}`,
    notConfigured:
      'Google sign-in is not configured for this app yet. Public channel playlists work anyway.',
    setupGuide: 'Setup guide',
    clientIdLabel: 'OAuth Client ID (advanced)',
    clientIdHelp: 'Leave empty to use the project one.',
    save: 'Save',

    library: 'Library',
    manualPlaylists: 'Playlists added by you',
    noManualPlaylists: 'No playlist added.',
    remove: 'Remove',
    kindOverrides: (n) =>
      n === 1
        ? '1 playlist with a manually chosen type'
        : `${n} playlists with a manually chosen type`,
    resetKinds: 'Reset to automatic type',
    reloadLibrary: 'Reload library',
    catalogGenerated: (date) => `Channel catalog updated on ${date}`,

    install: 'Install the app',
    installButton: 'Install',
    installed: 'The app is installed on this device.',
    installWindows:
      'Windows: open this page in Edge or Chrome, then menu ⋯ → "Install this site as an app".',
    installAndroid:
      'Android: download the APK from the project Releases page, or in Chrome menu ⋮ → "Install app".',
    releasesLink: 'Releases page (Android APK)',

    about: 'About',
    version: (version, date) => `Version ${version} · built on ${date}`,
    sourceCode: 'Source code on GitHub',
    disclaimer:
      'Unofficial app, not affiliated with YouTube or Google. Videos play in the official YouTube player.',
    clearData: 'Clear local data',
    clearDataConfirm:
      'Delete settings, queue and added playlists on this device? This cannot be undone.',
  },

  common: {
    retry: 'Retry',
    cancel: 'Cancel',
    close: 'Close',
    loading: 'Loading…',
    offline: 'You are offline: some features are unavailable.',
  },
};
