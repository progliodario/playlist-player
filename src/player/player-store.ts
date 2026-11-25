/**
 * Playback state and commands. Glue between the pure queue logic
 * (src/domain/queue.ts) and the YouTube player (./youtube-player-engine.ts).
 *
 * Two stores on purpose:
 *  - usePlayerStore: queue, status, volume... (persisted, changes rarely)
 *  - usePlayerClock: current time and duration (changes several times per second,
 *    not persisted, so only the progress bar re-renders)
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as Queue from '../domain/queue.ts';
import type { Playlist, Track } from '../domain/types.ts';
import { safeStorage, STORAGE_KEYS } from '../state/storage-keys.ts';
import { YT_STATE } from './youtube-iframe-api.ts';
import { playerEngine } from './youtube-player-engine.ts';

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'ended';

/** "Previous" restarts the current track when more than this many seconds have played. */
const RESTART_THRESHOLD_SECONDS = 3;
/** Stop auto-skipping after this many unplayable videos in a row. */
const MAX_CONSECUTIVE_ERRORS = 5;
const SKIP_DELAY_MS = 1200;
const CLOCK_INTERVAL_MS = 500;
const RESUME_SAVE_INTERVAL_MS = 5000;

export interface PlayerError {
  code: number;
  videoId: string;
  /** True when auto-skipping stopped because too many videos failed in a row. */
  gaveUp: boolean;
}

interface PlayerState {
  queue: Queue.QueueState | null;
  status: PlaybackStatus;
  volume: number;
  muted: boolean;
  /** Preferred repeat mode, applied to new queues. */
  repeat: Queue.RepeatMode;
  /** Video id currently loaded in the iframe (null after a page reload). */
  loadedVideoId: string | null;
  /** Videos that could not be played during this session. */
  failedVideoIds: string[];
  lastError: PlayerError | null;

  playPlaylist(playlist: Playlist, options?: { startIndex?: number; shuffle?: boolean }): void;
  playTracks(tracks: Track[], options?: Queue.CreateQueueOptions): void;
  togglePlay(): void;
  next(): void;
  previous(): void;
  seek(seconds: number): void;
  seekBy(deltaSeconds: number): void;
  setVolume(volume: number): void;
  toggleMute(): void;
  toggleShuffle(): void;
  cycleRepeat(): void;
  jumpTo(trackIndex: number): void;
  clearQueue(): void;
  dismissError(): void;
}

export const usePlayerClock = create<{ currentTime: number; duration: number }>()(() => ({
  currentTime: 0,
  duration: 0,
}));

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: null,
      status: 'idle',
      volume: 100,
      muted: false,
      repeat: 'off',
      loadedVideoId: null,
      failedVideoIds: [],
      lastError: null,

      playPlaylist(playlist, options = {}) {
        get().playTracks(playlist.tracks, {
          startIndex: options.startIndex,
          shuffle: options.shuffle ?? false,
          sourceKey: playlist.key,
          sourceTitle: playlist.title,
        });
      },

      playTracks(tracks, options = {}) {
        const queue = Queue.createQueue(tracks, { repeat: get().repeat, ...options });
        if (!queue) return;
        consecutiveErrors = 0;
        set({ queue, lastError: null });
        loadCurrent(true, 0);
      },

      togglePlay() {
        const { status, queue, loadedVideoId } = get();
        if (!queue) return;
        if (status === 'playing' || status === 'buffering' || status === 'loading') {
          playerEngine.pause();
          return;
        }
        const track = Queue.currentTrack(queue);
        if (status === 'ended') {
          set({ queue: { ...queue, position: 0 } });
          loadCurrent(true, 0);
        } else if (!playerEngine.isCreated || loadedVideoId !== track?.videoId) {
          loadCurrent(true, readResumeTime());
        } else {
          playerEngine.play();
        }
      },

      next() {
        const queue = get().queue;
        if (!queue) return;
        const moved = Queue.next(queue, 'user');
        if (!moved) return;
        set({ queue: moved });
        loadCurrent(true, 0);
      },

      previous() {
        const queue = get().queue;
        if (!queue) return;
        if (usePlayerClock.getState().currentTime > RESTART_THRESHOLD_SECONDS) {
          get().seek(0);
          return;
        }
        set({ queue: Queue.previous(queue) });
        loadCurrent(true, 0);
      },

      seek(seconds) {
        playerEngine.seekTo(seconds);
        usePlayerClock.setState({ currentTime: seconds });
      },

      seekBy(delta) {
        const { currentTime, duration } = usePlayerClock.getState();
        const target = Math.min(Math.max(0, currentTime + delta), duration || Infinity);
        get().seek(target);
      },

      setVolume(volume) {
        const clamped = Math.round(Math.min(100, Math.max(0, volume)));
        playerEngine.setVolume(clamped);
        if (clamped > 0 && get().muted) playerEngine.setMuted(false);
        set({ volume: clamped, muted: clamped === 0 ? get().muted : false });
      },

      toggleMute() {
        const muted = !get().muted;
        playerEngine.setMuted(muted);
        set({ muted });
      },

      toggleShuffle() {
        const queue = get().queue;
        if (queue) set({ queue: Queue.setShuffle(queue, !queue.shuffle) });
      },

      cycleRepeat() {
        const queue = get().queue;
        const repeat = Queue.nextRepeatMode(queue?.repeat ?? get().repeat);
        set({ repeat, queue: queue ? { ...queue, repeat } : null });
      },

      jumpTo(trackIndex) {
        const queue = get().queue;
        if (!queue) return;
        set({ queue: Queue.jumpToTrack(queue, trackIndex) });
        loadCurrent(true, 0);
      },

      clearQueue() {
        playerEngine.stop();
        stopClock();
        safeStorage.remove(STORAGE_KEYS.playerResumeTime);
        usePlayerClock.setState({ currentTime: 0, duration: 0 });
        set({ queue: null, status: 'idle', loadedVideoId: null, lastError: null });
      },

      dismissError() {
        set({ lastError: null });
      },
    }),
    {
      name: STORAGE_KEYS.player,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ queue: s.queue, volume: s.volume, muted: s.muted, repeat: s.repeat }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        playerEngine.setVolume(state.volume);
        playerEngine.setMuted(state.muted);
        const track = state.queue ? Queue.currentTrack(state.queue) : null;
        usePlayerClock.setState({
          currentTime: readResumeTime(),
          duration: track?.durationSeconds ?? 0,
        });
      },
    },
  ),
);

// --- engine binding -------------------------------------------------------------------

let consecutiveErrors = 0;
let clockTimer = 0;
let lastResumeSave = 0;

function loadCurrent(autoplay: boolean, startSeconds: number) {
  const queue = usePlayerStore.getState().queue;
  const track = queue ? Queue.currentTrack(queue) : null;
  if (!track) return;
  usePlayerStore.setState({
    status: autoplay ? 'loading' : 'paused',
    loadedVideoId: track.videoId,
  });
  usePlayerClock.setState({ currentTime: startSeconds, duration: track.durationSeconds ?? 0 });
  playerEngine.load(track.videoId, startSeconds, autoplay).catch(() => {
    usePlayerStore.setState({
      status: 'paused',
      lastError: { code: -1, videoId: track.videoId, gaveUp: true },
    });
  });
}

playerEngine.setListener({
  onStateChange(state) {
    switch (state) {
      case YT_STATE.PLAYING:
        consecutiveErrors = 0;
        usePlayerStore.setState({ status: 'playing', lastError: null });
        startClock();
        break;
      case YT_STATE.PAUSED:
      case YT_STATE.CUED:
        usePlayerStore.setState({ status: 'paused' });
        stopClock();
        saveResumeTime(true);
        break;
      case YT_STATE.BUFFERING:
        usePlayerStore.setState({ status: 'buffering' });
        break;
      case YT_STATE.ENDED:
        stopClock();
        handleEnded();
        break;
      default:
        break; // UNSTARTED: keep "loading"
    }
  },

  onError(code) {
    const { queue, failedVideoIds } = usePlayerStore.getState();
    const track = queue ? Queue.currentTrack(queue) : null;
    if (!queue || !track) return;
    consecutiveErrors++;
    const gaveUp = consecutiveErrors >= MAX_CONSECUTIVE_ERRORS;
    usePlayerStore.setState({
      status: 'paused',
      failedVideoIds: failedVideoIds.includes(track.videoId)
        ? failedVideoIds
        : [...failedVideoIds, track.videoId],
      lastError: { code, videoId: track.videoId, gaveUp },
    });
    if (gaveUp) return;
    window.setTimeout(() => {
      const current = usePlayerStore.getState().queue;
      // Skip only if the user did not move to another track meanwhile.
      if (!current || Queue.currentTrack(current)?.videoId !== track.videoId) return;
      const moved = Queue.next(current, 'user');
      if (!moved) {
        usePlayerStore.setState({ status: 'ended' });
        return;
      }
      usePlayerStore.setState({ queue: moved });
      loadCurrent(true, 0);
    }, SKIP_DELAY_MS);
  },
});

function handleEnded() {
  const queue = usePlayerStore.getState().queue;
  if (!queue) return;
  const moved = Queue.next(queue, 'ended');
  if (!moved) {
    usePlayerStore.setState({ status: 'ended' });
    safeStorage.remove(STORAGE_KEYS.playerResumeTime);
    return;
  }
  usePlayerStore.setState({ queue: moved });
  loadCurrent(true, 0);
}

function startClock() {
  stopClock();
  const tick = () => {
    usePlayerClock.setState({
      currentTime: playerEngine.getCurrentTime(),
      duration: playerEngine.getDuration() || usePlayerClock.getState().duration,
    });
    saveResumeTime(false);
  };
  tick();
  clockTimer = window.setInterval(tick, CLOCK_INTERVAL_MS);
}

function stopClock() {
  window.clearInterval(clockTimer);
  clockTimer = 0;
}

function saveResumeTime(force: boolean) {
  const now = Date.now();
  if (!force && now - lastResumeSave < RESUME_SAVE_INTERVAL_MS) return;
  lastResumeSave = now;
  safeStorage.set(STORAGE_KEYS.playerResumeTime, String(Math.floor(playerEngine.getCurrentTime())));
}

function readResumeTime(): number {
  const value = Number(safeStorage.get(STORAGE_KEYS.playerResumeTime));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (usePlayerStore.getState().status === 'playing') saveResumeTime(true);
  });
}

// --- selectors ------------------------------------------------------------------------

export function useCurrentTrack(): Track | null {
  return usePlayerStore((s) => (s.queue ? Queue.currentTrack(s.queue) : null));
}
