/**
 * Screen reader announcements (WCAG 4.1.3 Status Messages).
 *
 *   announce('In riproduzione: …')         polite: read when the user is idle
 *   announce('Errore …', 'assertive')     assertive: interrupts (errors only)
 *
 * The live regions are rendered once by <LiveAnnouncer/> (src/ui/a11y/LiveAnnouncer.tsx).
 */
import { create } from 'zustand';

export type Politeness = 'polite' | 'assertive';

interface AnnouncerState {
  polite: string;
  assertive: string;
}

export const useAnnouncerStore = create<AnnouncerState>()(() => ({ polite: '', assertive: '' }));

const CLEAR_DELAY_MS = 60;

export function announce(message: string, politeness: Politeness = 'polite'): void {
  // Clear first so that the same message twice in a row is announced again.
  useAnnouncerStore.setState({ [politeness]: '' });
  window.setTimeout(() => useAnnouncerStore.setState({ [politeness]: message }), CLEAR_DELAY_MS);
}
