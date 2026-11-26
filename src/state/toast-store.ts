/**
 * Short notifications shown at the bottom of the screen (rendered by <Toasts/>).
 *
 * Accessibility (WCAG 2.2.1 Timing Adjustable): errors stay until the user closes them;
 * other toasts disappear after a few seconds, but the timer pauses while the pointer or
 * the keyboard focus is on them (see Toasts.tsx).
 */
import { create } from 'zustand';
import { announce } from './announcer-store.ts';

export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
  /** Milliseconds before auto-dismiss, or null to keep it until closed. */
  durationMs: number | null;
}

interface ToastState {
  toasts: Toast[];
  dismiss(id: number): void;
}

const DEFAULT_DURATION_MS = 6000;
const MAX_VISIBLE = 3;
let nextId = 1;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function showToast(message: string, kind: ToastKind = 'info'): void {
  const toast: Toast = {
    id: nextId++,
    message,
    kind,
    durationMs: kind === 'error' ? null : DEFAULT_DURATION_MS,
  };
  useToastStore.setState((s) => ({ toasts: [...s.toasts.slice(-(MAX_VISIBLE - 1)), toast] }));
  // The toast itself is not a live region: the announcer reads it exactly once.
  announce(message, kind === 'error' ? 'assertive' : 'polite');
}
