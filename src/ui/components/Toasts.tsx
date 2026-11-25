import { useToastStore } from '../../state/toast-store.ts';
import { Icon } from '../icons.tsx';

export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.kind}`}>
          <span>{toast.message}</span>
          <button
            type="button"
            className="icon-button icon-button--small"
            onClick={() => dismiss(toast.id)}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
