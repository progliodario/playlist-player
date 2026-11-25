/** Short notifications shown at the bottom of the screen (rendered by <Toasts/>). */
import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastState {
  toasts: Toast[];
  dismiss(id: number): void;
}

const DEFAULT_DURATION_MS = 4000;
let nextId = 1;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function showToast(
  message: string,
  kind: ToastKind = 'info',
  durationMs = DEFAULT_DURATION_MS,
) {
  const id = nextId++;
  useToastStore.setState((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, kind }] }));
  window.setTimeout(() => useToastStore.getState().dismiss(id), durationMs);
}
