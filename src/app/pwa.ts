/**
 * Progressive Web App wiring: service worker registration (offline app shell,
 * automatic updates) and the "Install app" prompt.
 *
 * Updates: the service worker activates a new version immediately (skipWaiting and
 * clientsClaim in vite.config.ts) and the page reloads itself. An app left open for hours
 * (installed window, Android app) also checks for a new version every 30 minutes.
 */
import { registerSW } from 'virtual:pwa-register';
import { create } from 'zustand';

/** Chrome/Edge event fired when the app can be installed (not in lib.dom yet). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  /** Present when the browser allows showing the install dialog. */
  promptEvent: BeforeInstallPromptEvent | null;
  /** True when running as an installed app (standalone window or Android wrapper). */
  isInstalled: boolean;
}

export const useInstallStore = create<InstallState>()(() => ({
  promptEvent: null,
  isInstalled: false,
}));

const UPDATE_CHECK_MS = 30 * 60 * 1000;

export function setupPwa(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      window.setInterval(() => {
        if (navigator.onLine) void registration.update().catch(() => undefined);
      }, UPDATE_CHECK_MS);
    },
  });

  useInstallStore.setState({
    isInstalled: window.matchMedia('(display-mode: standalone)').matches,
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    useInstallStore.setState({ promptEvent: event as BeforeInstallPromptEvent });
  });

  window.addEventListener('appinstalled', () => {
    useInstallStore.setState({ promptEvent: null, isInstalled: true });
  });
}

export async function promptInstall(): Promise<void> {
  const event = useInstallStore.getState().promptEvent;
  if (!event) return;
  await event.prompt();
  await event.userChoice;
  useInstallStore.setState({ promptEvent: null });
}
