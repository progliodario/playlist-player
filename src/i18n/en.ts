/** English UI text. Must match the shape of it.ts (the source of truth). */
import type { Strings } from './it.ts';

const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);
const thousands = (n: number) => n.toLocaleString('en-GB');

export const en: Strings = {
  locale: 'en-GB',

  nav: {
    library: 'Library',
    nowPlaying: 'Now playing',
    settings: 'Settings',
    mainNavigation: 'Main navigation',
    skipToContent: 'Skip to main content',
  },

  library: {
    title: 'Library',
    greeting: (hour) =>
      hour < 5
        ? 'Good night'
        : hour < 12
          ? 'Good morning'
          : hour < 18
            ? 'Good afternoon'
            : 'Good evening',
    heroSubtitle: (playlists, tracks) =>
      `${plural(playlists, 'playlist', 'playlists')} · ${tracks === 1 ? '1 song' : `${thousands(tracks)} songs`} to enjoy`,
    searchPlaceholder: 'Search playlists…',
    filterLabel: 'Playlist type',
    filterAll: 'All',
    filterMusic: 'Music',
    filterVideo: 'Videos',
    sortLabel: 'Sort by',
    sortDefault: 'Channel order',
    sortTitle: 'Name',
    sortSize: 'Most items',
    sortRecent: 'Recently updated',
    sectionAccount: 'Your account',
    sectionCatalog: (channel) => `From channel ${channel}`,
    sectionManual: 'Added by you',
    resultsCount: (n) => (n === 1 ? '1 playlist found' : `${thousands(n)} playlists found`),
    noResults: 'No playlist matches the filters.',
    catalogError: 'Could not load the channel playlists.',
    accountError: 'Could not load your account playlists.',
    accountSignedOutHint:
      'Connect your Google account to also see private playlists and the videos you like.',
    accountExpiredHint: 'Your Google session expired: one click reconnects you.',
    signIn: 'Sign in with Google',
    reconnect: 'Reconnect',
    addPlaylist: 'Add playlist',
    manualEmptyHint: 'You can add any public playlist by pasting its link.',
    likedVideos: 'Liked videos',
    catalogUpdated: 'Library updated with the latest changes from the channel.',
    itemCount: (n, kind) =>
      kind === 'music' ? plural(n, 'song', 'songs') : plural(n, 'video', 'videos'),
    playlistsCount: (n) => plural(n, 'playlist', 'playlists'),
  },

  addPlaylist: {
    title: 'Add a playlist',
    description:
      'Paste the link of a YouTube or YouTube Music playlist. It must be public or unlisted.',
    fieldLabel: 'Playlist link',
    placeholder: 'https://www.youtube.com/playlist?list=…',
    submit: 'Add',
    checking: 'Checking…',
    invalidLink: 'Invalid link: it must contain the "list=" parameter.',
    notFound: 'Playlist not found, or it is private.',
    added: (title) => `Added "${title}"`,
  },

  playlist: {
    play: 'Play',
    playNamed: (title) => `Play ${title}`,
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
    tracksHeading: 'Tracks',
    noTrackResults: 'No item matches the search.',
    unplayable: 'Unplayable',
    nowPlaying: 'Now playing',
    updatedOn: (date) => `Updated on ${date}`,
    signedOutLimit: 'Without Google sign-in at most 200 items are read, without durations.',
  },

  player: {
    region: 'Player',
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
    volumeValue: (n) => `${n}%`,
    seek: 'Position',
    seekValue: (current, total) => `${current} of ${total}`,
    fullscreen: 'Full screen',
    upNext: 'Up next',
    from: (title) => `From: ${title}`,
    clearQueue: 'Clear queue',
    queueEnd: 'End of queue',
    moreInQueue: (n) => (n === 1 ? 'and 1 more' : `and ${thousands(n)} more`),
    errorSkipping: 'This video cannot be played here: skipping to the next one.',
    errorGaveUp: 'Too many unplayable videos in a row: playback stopped.',
    openOnYouTube: 'Open on YouTube',
    openInYouTubeMusic: 'Open in YouTube Music',
    restoredHint: 'Press play to resume where you left off.',
    nowPlayingAnnouncement: (title, artist) =>
      artist ? `Now playing: ${title}, by ${artist}` : `Now playing: ${title}`,
    iframeTitle: (title) => `YouTube video: ${title}`,
    iframeTitleIdle: 'YouTube player',
    nativeHint:
      'Playing in the app’s own player: no ads, keeps going with the screen off, controls on the lock screen.',
    openNativePlayer: 'Open the player',
  },

  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    languageAuto: 'Automatic',
    theme: 'Theme',
    themeAuto: 'Automatic',
    themeDark: 'Nocturne',
    themeLight: 'Dawn',

    account: 'Google account',
    accountIntro:
      'Optional. When signed in you also see private and unlisted playlists and liked videos. Read-only access: the app cannot change anything.',
    signedInAs: (name) => `Signed in as ${name}`,
    signedIn: 'Signed in',
    signIn: 'Sign in with Google',
    signOut: 'Sign out',
    signingIn: 'Signing in…',
    expired: 'Session expired: press Sign in to reconnect.',
    signInError: (message) => `Sign-in failed: ${message}`,
    notConfigured:
      'Google sign-in is not active in this version of the app yet. Public channel playlists work anyway.',
    setupGuide: 'How to enable it (for the app maintainer)',
    clientIdLabel: 'OAuth Client ID (advanced)',
    clientIdHelp: 'Leave empty to use the project one.',
    save: 'Save',

    listening: 'Ads and background listening',
    listeningWeb:
      'In a browser a page can only use the YouTube player: with its ads and only while the page is visible. The Android and Windows apps have their own player, without ads, that keeps playing with the screen off or the window minimized.',
    downloadApps: 'Download the apps (Android and Windows)',
    listeningPremium:
      'With the YouTube player ads disappear only with YouTube Premium, when you are signed in to YouTube with the same account in this browser.',
    signInYouTube: 'Sign in to YouTube in this browser',
    playbackMode: 'Player',
    playbackAdFree: 'Ad-free',
    playbackYouTube: 'YouTube player',
    playbackHelpAndroid:
      'Ad-free: no ads, keeps playing with the screen off, controls on the lock screen and on Bluetooth headphones. If it ever stops working (YouTube changes often), pick “YouTube player” until a new version of the app is out.',
    playbackHelpDesktop:
      'Ad-free: no ads, keeps playing with the window minimized, media keys and Windows controls. The part that reads YouTube (yt-dlp) updates itself; if it ever stops working, pick “YouTube player”.',
    playbackPending: 'The new player is used after the app reloads.',
    playbackApply: 'Reload and apply',

    shortcuts: 'Keyboard shortcuts',
    shortcutsToggle: 'Enable single-key shortcuts',
    shortcutsHelp:
      'They work when you are not typing in a field. Turn them off if you use voice control software or press them by mistake.',
    shortcutList: [
      ['Space / K', 'Play or pause'],
      ['J / L', 'Back / forward 10 seconds'],
      ['N / P', 'Next / previous track'],
      ['M', 'Mute on / off'],
      ['S', 'Shuffle'],
      ['R', 'Repeat mode'],
    ],

    library: 'Library',
    manualPlaylists: 'Playlists added by you',
    noManualPlaylists: 'No playlist added.',
    remove: 'Remove',
    removeNamed: (title) => `Remove ${title}`,
    kindOverrides: (n) =>
      n === 1
        ? '1 playlist with a manually chosen type'
        : `${n} playlists with a manually chosen type`,
    resetKinds: 'Reset to automatic type',
    catalogGenerated: (date) => `Channel catalog updated: ${date}`,
    catalogAutoUpdate:
      'The catalog updates by itself: every 15 minutes it checks whether the channel public playlists changed.',
    checkNow: 'Check now',
    checking: 'Checking…',
    catalogUpToDate: 'The catalog is already up to date.',

    install: 'Install the app',
    installButton: 'Install',
    installed: 'The app is installed on this device.',
    installWindows:
      'Windows: download and open playlist-player-setup.exe from the Releases page (ad-free player). Alternatively: Edge or Chrome → menu ⋯ → "Install this site as an app".',
    installAndroid:
      'Android: download and install the APK from the Releases page (ad-free player, also with the screen off).',
    releasesLink: 'Releases page (Android and Windows apps)',
    runningDesktop: (version) => `You are using the Windows app, version ${version}.`,
    runningAndroid: 'You are using the Android app.',

    about: 'About',
    version: (version, date) => `Version ${version} · built on ${date}`,
    sourceCode: 'Source code on GitHub',
    accessibility: 'Accessibility statement',
    disclaimer:
      'Unofficial app, not affiliated with YouTube or Google. Content stays on YouTube: the app does not download or keep videos.',
    clearData: 'Clear local data',
    clearDataConfirm:
      'Delete settings, queue and added playlists on this device? This cannot be undone.',
  },

  common: {
    retry: 'Retry',
    cancel: 'Cancel',
    close: 'Close',
    dismiss: 'Dismiss notification',
    clearSearch: 'Clear search',
    loading: 'Loading…',
    offline: 'You are offline: some features are unavailable.',
    opensInNewTab: '(opens in a new tab)',
  },
};
