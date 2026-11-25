import type { ReactNode } from 'react';

/** Centered message for loading / error / empty states, with an optional action. */
export function StatusMessage({
  tone = 'neutral',
  children,
  action,
}: {
  tone?: 'neutral' | 'error' | 'loading';
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={`status-message status-message--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {tone === 'loading' && <span className="spinner" aria-hidden="true" />}
      <p>{children}</p>
      {action}
    </div>
  );
}
