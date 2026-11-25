import { routeHref, type Route } from '../../app/router.ts';
import { appConfig } from '../../config/app-config.ts';
import { useStrings } from '../../i18n/index.ts';
import { usePlayerStore } from '../../player/player-store.ts';
import { useAuthStore } from '../../sources/account/auth-store.ts';
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
  if (item.route.name === 'library')
    return current.name === 'library' || current.name === 'playlist';
  return item.route.name === current.name;
}

/** Left column on desktop. */
export function Sidebar({ route }: { route: Route }) {
  const t = useStrings();
  const items = useNavItems();
  const profile = useAuthStore((s) => (s.status === 'signed-in' ? s.profile : null));
  return (
    <nav className="sidebar" aria-label={t.nav.mainNavigation}>
      <a className="sidebar__brand" href={routeHref({ name: 'library' })}>
        <Logo size={34} />
        <span>{appConfig.appName}</span>
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
      {profile && (
        <a className="sidebar__profile" href={routeHref({ name: 'settings' })}>
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              width={28}
              height={28}
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
      {items.map((item) => (
        <a
          key={item.route.name}
          className={`bottom-nav__link ${isActive(item, route) ? 'is-active' : ''}`}
          href={routeHref(item.route)}
          aria-current={isActive(item, route) ? 'page' : undefined}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
          {item.route.name === 'now' && hasQueue && <span className="bottom-nav__dot" />}
        </a>
      ))}
    </nav>
  );
}
