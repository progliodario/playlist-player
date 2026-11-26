import type { ReactNode } from 'react';
import { CassetteArt } from '../art/CassetteArt.tsx';

/**
 * Centered message for loading / error / empty states, with an optional action.
 * `art` shows the cassette illustration (for empty states).
 */
export function StatusMessage({
  tone = 'neutral',
  children,
  action,
  art = false,
}: {
  tone?: 'neutral' | 'error' | 'loading';
  children: ReactNode;
  action?: ReactNode;
  art?: boolean;
}) {
  return (
    <div
      className={`status-message status-message--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {art && <CassetteArt className="status-message__art" />}
      {tone === 'loading' && <span className="spinner" aria-hidden="true" />}
      <p>{children}</p>
      {action}
    </div>
  );
}
