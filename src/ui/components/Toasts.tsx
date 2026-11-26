import { useEffect, useRef, useState } from 'react';
import { useStrings } from '../../i18n/index.ts';
import { useToastStore, type Toast } from '../../state/toast-store.ts';
import { Icon } from '../icons.tsx';

/**
 * Notification area (visual only: showToast() also sends the text to the screen reader
 * announcer). Auto-dismiss pauses on hover and on keyboard focus.
 */
export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="toasts">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const t = useStrings();
  const dismiss = useToastStore((s) => s.dismiss);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.durationMs);
  const element = useRef<HTMLDivElement>(null);

  // Pause while hovered or while keyboard focus is inside (native listeners: the toast
  // is not itself interactive, only its close button is).
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const pause = () => setPaused(true);
    const resume = () => setPaused(false);
    node.addEventListener('pointerenter', pause);
    node.addEventListener('pointerleave', resume);
    node.addEventListener('focusin', pause);
    node.addEventListener('focusout', resume);
    return () => {
      node.removeEventListener('pointerenter', pause);
      node.removeEventListener('pointerleave', resume);
      node.removeEventListener('focusin', pause);
      node.removeEventListener('focusout', resume);
    };
  }, []);

  useEffect(() => {
    if (remaining.current === null || paused) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => dismiss(toast.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      if (remaining.current !== null) remaining.current -= Date.now() - startedAt;
    };
  }, [paused, dismiss, toast.id]);

  const icon = toast.kind === 'error' ? 'close' : toast.kind === 'success' ? 'check' : 'music';
  return (
    <div ref={element} className={`toast toast--${toast.kind}`}>
      <span className="toast__icon">
        <Icon name={icon} size={18} />
      </span>
      <span className="toast__message">{toast.message}</span>
      <button
        type="button"
        className="icon-button icon-button--small"
        aria-label={t.common.dismiss}
        onClick={() => dismiss(toast.id)}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
