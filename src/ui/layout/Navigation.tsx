import type { CSSProperties } from 'react';
import { routeHref, type Route } from '../../app/router.ts';
import { appConfig } from '../../config/app-config.ts';
import { useStrings } from '../../i18n/index.ts';
import { useCurrentTrack, usePlayerStore } from '../../player/player-store.ts';
import { useAuthStore } from '../../sources/account/auth-store.ts';
import { hueFromString } from '../art/art-math.ts';
import { Vinyl } from '../art/Vinyl.tsx';
import { trackSubtitle } from '../display.ts';
import { Icon, Logo, type IconName } from '../icons.tsx';

interface NavItem {
  route: Route;
  icon: IconName;
  label: string;
}

function useNavItems(): NavItem[] {
  const t = useStrings();
  return [
    { route: { name: 'library' }, icon: 'library', label: t.nav.library },
    { route: { name: 'now' }, icon: 'nowPlaying', label: t.nav.nowPlaying },
    { route: { name: 'settings' }, icon: 'settings', label: t.nav.settings },
  ];
}

function isActive(item: NavItem, current: Route): boolean {
  if (item.route.name === 'library') {
    return current.name === 'library' || current.name === 'playlist';
  }
  return item.route.name === current.name;
}

/** Left column on desktop: brand, navigation, a small "now playing" record, profile. */
export function Sidebar({ route }: { route: Route }) {
  const t = useStrings();
  const items = useNavItems();
  const profile = useAuthStore((s) => (s.status === 'signed-in' ? s.profile : null));
  const track = useCurrentTrack();
  const playing = usePlayerStore((s) => s.playIntent);
  const sourceKey = usePlayerStore((s) => s.queue?.sourceKey ?? 'idle');

  return (
    <nav className="sidebar" aria-label={t.nav.mainNavigation}>
      <a className="sidebar__brand" href={routeHref({ name: 'library' })}>
        <Logo size={40} />
        <span className="sidebar__brand-name">{appConfig.appName}</span>
      </a>
      <ul className="sidebar__list">
        {items.map((item) => (
          <li key={item.route.name}>
            <a
              className={`sidebar__link ${isActive(item, route) ? 'is-active' : ''}`}
              href={routeHref(item.route)}
              aria-current={isActive(item, route) ? 'page' : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>

      {track && (
        <a
          className="sidebar__now"
          href={routeHref({ name: 'now' })}
          style={{ '--hue': hueFromString(sourceKey) } as CSSProperties}
        >
          <Vinyl hue={hueFromString(sourceKey)} spinning={playing} className="sidebar__vinyl" />
          <span className="sidebar__now-text">
            <span className="sidebar__now-label">{t.nav.nowPlaying}</span>
            <span className="sidebar__now-title">{track.title}</span>
            <span className="sidebar__now-artist">{trackSubtitle(track)}</span>
          </span>
        </a>
      )}

      {profile && (
        <a className="sidebar__profile" href={routeHref({ name: 'settings' })}>
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              width={32}
              height={32}
              referrerPolicy="no-referrer"
            />
          ) : (
            <Icon name="account" />
          )}
          <span>{profile.name}</span>
        </a>
      )}
    </nav>
  );
}

/** Bottom tab bar on phones. */
export function BottomNav({ route }: { route: Route }) {
  const t = useStrings();
  const items = useNavItems();
  const hasQueue = usePlayerStore((s) => s.queue !== null);
  return (
    <nav className="bottom-nav" aria-label={t.nav.mainNavigation}>
      <ul className="bottom-nav__list">
        {items.map((item) => (
          <li key={item.route.name}>
            <a
              className={`bottom-nav__link ${isActive(item, route) ? 'is-active' : ''}`}
              href={routeHref(item.route)}
              aria-current={isActive(item, route) ? 'page' : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.route.name === 'now' && hasQueue && (
                <span className="bottom-nav__dot" aria-hidden="true" />
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
