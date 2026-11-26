import type { ReactNode } from 'react';
import { useStrings } from '../../i18n/index.ts';

/**
 * Link to another site, opened in a new tab. Screen readers are told about the new tab
 * (WCAG 3.2.5 / G201), sighted users see the "external" icon passed in children.
 */
export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const t = useStrings();
  return (
    <a href={href} className={className} target="_blank" rel="noreferrer">
      {children}
      <span className="visually-hidden"> {t.common.opensInNewTab}</span>
    </a>
  );
}
