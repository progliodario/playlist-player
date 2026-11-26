import { useAnnouncerStore } from '../../state/announcer-store.ts';

/**
 * The two live regions used by announce() (src/state/announcer-store.ts).
 * Rendered once by <App/>; always in the DOM so screen readers pick up every change.
 */
export function LiveAnnouncer() {
  const polite = useAnnouncerStore((s) => s.polite);
  const assertive = useAnnouncerStore((s) => s.assertive);
  return (
    <div className="visually-hidden">
      <div role="status" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </div>
  );
}
