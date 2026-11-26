import { useStrings } from '../../i18n/index.ts';

export const MAIN_CONTENT_ID = 'main-content';

/** Moves keyboard focus to the main content area (the page heading when present). */
export function focusMainContent(): void {
  const main = document.getElementById(MAIN_CONTENT_ID);
  const heading = main?.querySelector<HTMLElement>('h1');
  (heading ?? main)?.focus({ preventScroll: false });
}

/**
 * First focusable element of the page (WCAG 2.4.1 Bypass Blocks). Visible only when
 * focused. It does not use a hash link because the app router uses the URL hash.
 */
export function SkipLink() {
  const t = useStrings();
  return (
    <a
      className="skip-link"
      href={`#${MAIN_CONTENT_ID}`}
      onClick={(event) => {
        event.preventDefault();
        focusMainContent();
      }}
    >
      {t.nav.skipToContent}
    </a>
  );
}
