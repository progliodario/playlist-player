import { useEffect, useId, useState, type ReactNode } from 'react';
import {
  clearLocalData,
  removeManualPlaylist,
  signInWithGoogle,
  signOutOfGoogle,
} from '../../app/actions.ts';
import { promptInstall, useInstallStore } from '../../app/pwa.ts';
import { APP_VERSION, appConfig, BUILD_TIME } from '../../config/app-config.ts';
import { formatDate, formatDateTime, useStrings } from '../../i18n/index.ts';
import { getDesktopBridge, getShell } from '../../platform/shell.ts';
import { playbackTarget } from '../../player/player-engine.ts';
import { useAuthStore } from '../../sources/account/auth-store.ts';
import { preloadGoogleIdentity } from '../../sources/account/google-auth.ts';
import { useLibraryStore } from '../../state/library-store.ts';
import {
  useOAuthClientId,
  useSettingsStore,
  type LanguageSetting,
  type PlaybackMode,
  type ThemeSetting,
} from '../../state/settings-store.ts';
import { showToast } from '../../state/toast-store.ts';
import { ExternalLink } from '../components/ExternalLink.tsx';
import { SegmentedControl } from '../components/SegmentedControl.tsx';
import { Icon, type IconName } from '../icons.tsx';

const DOCS_URL = `${appConfig.repositoryUrl}/blob/main/docs`;
const YOUTUBE_SIGN_IN_URL = 'https://accounts.google.com/ServiceLogin?service=youtube';
const RELEASES_URL = `${appConfig.repositoryUrl}/releases/latest`;

/** Settings page: one card per topic, each with its own h2. */
export function SettingsView() {
  const t = useStrings();
  return (
    <div className="view settings">
      <h1 className="view__title" tabIndex={-1}>
        {t.settings.title}
      </h1>
      <div className="settings__grid">
        <AppearanceSection />
        <AccountSection />
        <ListeningSection />
        <ShortcutsSection />
        <LibrarySettingsSection />
        <InstallSection />
        <AboutSection />
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconName;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section className="settings-card" aria-labelledby={headingId}>
      <h2 id={headingId} className="settings-card__title">
        <span className="settings-card__icon" aria-hidden="true">
          <Icon name={icon} size={20} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function AppearanceSection() {
  const t = useStrings();
  const language = useSettingsStore((s) => s.language);
  const theme = useSettingsStore((s) => s.theme);
  const { setLanguage, setTheme } = useSettingsStore.getState();
  return (
    <SettingsCard title={t.settings.appearance} icon="sparkle">
      <div className="settings-row">
        <span aria-hidden="true">{t.settings.language}</span>
        <SegmentedControl<LanguageSetting>
          label={t.settings.language}
          value={language}
          onChange={setLanguage}
          options={[
            { value: 'auto', label: t.settings.languageAuto },
            { value: 'it', label: 'Italiano' },
            { value: 'en', label: 'English' },
          ]}
        />
      </div>
      <div className="settings-row">
        <span aria-hidden="true">{t.settings.theme}</span>
        <SegmentedControl<ThemeSetting>
          label={t.settings.theme}
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'auto', label: t.settings.themeAuto },
            { value: 'dark', label: t.settings.themeDark },
            { value: 'light', label: t.settings.themeLight },
          ]}
        />
      </div>
    </SettingsCard>
  );
}

function AccountSection() {
  const t = useStrings();
  const clientId = useOAuthClientId();
  const override = useSettingsStore((s) => s.oauthClientIdOverride);
  const setOverride = useSettingsStore((s) => s.setOauthClientIdOverride);
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const error = useAuthStore((s) => s.error);
  const [draft, setDraft] = useState(override);
  const inputId = useId();

  useEffect(() => {
    if (clientId) void preloadGoogleIdentity().catch(() => undefined);
  }, [clientId]);

  const statusText =
    status === 'signed-in'
      ? profile?.name
        ? t.settings.signedInAs(profile.name)
        : t.settings.signedIn
      : status === 'expired'
        ? t.settings.expired
        : status === 'signing-in'
          ? t.settings.signingIn
          : '';

  return (
    <SettingsCard title={t.settings.account} icon="account">
      <p className="muted">{t.settings.accountIntro}</p>

      {!clientId && (
        <p className="notice">
          {t.settings.notConfigured}{' '}
          <ExternalLink href={`${DOCS_URL}/sviluppo/account-google.md`}>
            {t.settings.setupGuide}
          </ExternalLink>
        </p>
      )}

      {clientId && (
        <div className="settings-row">
          <span className="account-status" role="status">
            {status === 'signed-in' && profile?.avatarUrl && (
              <img
                src={profile.avatarUrl}
                alt=""
                width={36}
                height={36}
                referrerPolicy="no-referrer"
              />
            )}
            {statusText}
          </span>
          {status === 'signed-in' ? (
            <button type="button" className="button" onClick={() => void signOutOfGoogle()}>
              {t.settings.signOut}
            </button>
          ) : (
            <button
              type="button"
              className="button button--primary"
              disabled={status === 'signing-in'}
              onClick={() => void signInWithGoogle()}
            >
              <Icon name="account" size={18} /> {t.settings.signIn}
            </button>
          )}
        </div>
      )}
      {status === 'error' && error && error !== 'missing-client-id' && (
        <p className="form-error" role="alert">
          {t.settings.signInError(error)}
        </p>
      )}

      <details className="advanced">
        <summary>{t.settings.clientIdLabel}</summary>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            setOverride(draft);
          }}
        >
          <label htmlFor={inputId} className="visually-hidden">
            {t.settings.clientIdLabel}
          </label>
          <input
            id={inputId}
            className="text-input"
            value={draft}
            autoComplete="off"
            spellCheck={false}
            placeholder={appConfig.google.oauthClientId || '1234-abc.apps.googleusercontent.com'}
            aria-describedby={`${inputId}-help`}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" className="button">
            {t.settings.save}
          </button>
        </form>
        <p id={`${inputId}-help`} className="muted small">
          {t.settings.clientIdHelp}
        </p>
      </details>
    </SettingsCard>
  );
}

/**
 * Ads and background listening. Browsers can only use the YouTube player; the Android
 * and Windows apps have their own ad-free player (src/player/player-engine.ts).
 */
function ListeningSection() {
  const t = useStrings();
  const shell = getShell();
  const mode = useSettingsStore((s) => s.playbackMode);
  const setMode = useSettingsStore((s) => s.setPlaybackMode);
  const helpId = useId();

  if (shell === 'web') {
    return (
      <SettingsCard title={t.settings.listening} icon="headphones">
        <p>{t.settings.listeningWeb}</p>
        <ExternalLink className="button button--primary" href={RELEASES_URL}>
          <Icon name="external" size={16} /> {t.settings.downloadApps}
        </ExternalLink>
        <p className="muted">{t.settings.listeningPremium}</p>
        <ExternalLink className="chip-link" href={YOUTUBE_SIGN_IN_URL}>
          <Icon name="external" size={16} /> {t.settings.signInYouTube}
        </ExternalLink>
      </SettingsCard>
    );
  }

  // The engine is chosen at startup: a new choice applies after a reload.
  const activeMode: PlaybackMode = playbackTarget === 'youtube' ? 'youtube' : 'ad-free';
  return (
    <SettingsCard title={t.settings.listening} icon="headphones">
      <div className="settings-row">
        <span aria-hidden="true">{t.settings.playbackMode}</span>
        <SegmentedControl<PlaybackMode>
          label={t.settings.playbackMode}
          value={mode}
          onChange={setMode}
          options={[
            { value: 'ad-free', label: t.settings.playbackAdFree },
            { value: 'youtube', label: t.settings.playbackYouTube },
          ]}
        />
      </div>
      <p id={helpId} className="muted">
        {shell === 'android' ? t.settings.playbackHelpAndroid : t.settings.playbackHelpDesktop}
      </p>
      {mode !== activeMode && (
        <div className="settings-apply" role="status">
          <p>{t.settings.playbackPending}</p>
          <button
            type="button"
            className="button button--primary"
            aria-describedby={helpId}
            onClick={() => window.location.reload()}
          >
            {t.settings.playbackApply}
          </button>
        </div>
      )}
      {mode === 'youtube' && <p className="muted">{t.settings.listeningPremium}</p>}
    </SettingsCard>
  );
}

function ShortcutsSection() {
  const t = useStrings();
  const enabled = useSettingsStore((s) => s.keyboardShortcuts);
  const setEnabled = useSettingsStore((s) => s.setKeyboardShortcuts);
  const id = useId();
  return (
    <SettingsCard title={t.settings.shortcuts} icon="settings">
      <div className="switch-row">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="switch"
          checked={enabled}
          aria-describedby={`${id}-help`}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        <label htmlFor={id}>{t.settings.shortcutsToggle}</label>
      </div>
      <p id={`${id}-help`} className="muted small">
        {t.settings.shortcutsHelp}
      </p>
      <dl className="shortcut-list">
        {t.settings.shortcutList.map(([keys, description]) => (
          <div key={keys} className="shortcut-list__row">
            <dt>
              {keys.split(' / ').map((key, i) => (
                <span key={key}>
                  {i > 0 && ' / '}
                  <kbd>{key}</kbd>
                </span>
              ))}
            </dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
    </SettingsCard>
  );
}

function LibrarySettingsSection() {
  const t = useStrings();
  const manual = useSettingsStore((s) => s.manualPlaylists);
  const overrides = useSettingsStore((s) => s.kindOverrides);
  const generatedAt = useLibraryStore((s) => s.catalogGeneratedAt);
  const refreshCatalogIfChanged = useLibraryStore((s) => s.refreshCatalogIfChanged);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState('');
  const overrideCount = Object.keys(overrides).length;

  async function checkNow() {
    setChecking(true);
    setResult('');
    const changed = await refreshCatalogIfChanged();
    setChecking(false);
    if (changed) showToast(t.library.catalogUpdated, 'success');
    else setResult(t.settings.catalogUpToDate);
  }

  return (
    <SettingsCard title={t.settings.library} icon="library">
      <h3>{t.settings.manualPlaylists}</h3>
      {manual.length === 0 ? (
        <p className="muted">{t.settings.noManualPlaylists}</p>
      ) : (
        <ul className="settings-list">
          {manual.map((p) => (
            <li key={p.id}>
              <span>{p.title}</span>
              <button
                type="button"
                className="button button--ghost button--small"
                aria-label={t.settings.removeNamed(p.title)}
                onClick={() => void removeManualPlaylist(p.id)}
              >
                <Icon name="trash" size={16} /> {t.settings.remove}
              </button>
            </li>
          ))}
        </ul>
      )}
      {overrideCount > 0 && (
        <div className="settings-row">
          <span>{t.settings.kindOverrides(overrideCount)}</span>
          <button
            type="button"
            className="button button--small"
            onClick={() => useSettingsStore.setState({ kindOverrides: {} })}
          >
            {t.settings.resetKinds}
          </button>
        </div>
      )}
      <p className="muted">{t.settings.catalogAutoUpdate}</p>
      <div className="settings-row">
        <span className="muted">
          {generatedAt ? t.settings.catalogGenerated(formatDateTime(generatedAt, t.locale)) : ''}
        </span>
        <button
          type="button"
          className="button button--small"
          disabled={checking}
          onClick={() => void checkNow()}
        >
          {checking ? t.settings.checking : t.settings.checkNow}
        </button>
      </div>
      <p className="small" role="status">
        {result}
      </p>
    </SettingsCard>
  );
}

function InstallSection() {
  const t = useStrings();
  const promptEvent = useInstallStore((s) => s.promptEvent);
  const isInstalled = useInstallStore((s) => s.isInstalled);
  return (
    <SettingsCard title={t.settings.install} icon="plus">
      {getShell() === 'desktop' ? (
        <p>{t.settings.runningDesktop(getDesktopBridge()?.version ?? '')}</p>
      ) : getShell() === 'android' ? (
        <p>{t.settings.runningAndroid}</p>
      ) : isInstalled ? (
        <p>{t.settings.installed}</p>
      ) : (
        <>
          {promptEvent && (
            <button
              type="button"
              className="button button--primary"
              onClick={() => void promptInstall()}
            >
              <Icon name="plus" size={18} /> {t.settings.installButton}
            </button>
          )}
          <p className="muted">{t.settings.installWindows}</p>
          <p className="muted">{t.settings.installAndroid}</p>
        </>
      )}
      <ExternalLink href={RELEASES_URL}>{t.settings.releasesLink}</ExternalLink>
    </SettingsCard>
  );
}

function AboutSection() {
  const t = useStrings();
  return (
    <SettingsCard title={t.settings.about} icon="music">
      <p>{t.settings.version(APP_VERSION, formatDate(BUILD_TIME, t.locale))}</p>
      <ul className="link-list">
        <li>
          <ExternalLink href={appConfig.repositoryUrl}>{t.settings.sourceCode}</ExternalLink>
        </li>
        <li>
          <ExternalLink href={`${DOCS_URL}/utente/accessibilita.md`}>
            {t.settings.accessibility}
          </ExternalLink>
        </li>
      </ul>
      <p className="muted small">{t.settings.disclaimer}</p>
      <button
        type="button"
        className="button button--ghost button--danger button--small"
        onClick={() => {
          if (window.confirm(t.settings.clearDataConfirm)) clearLocalData();
        }}
      >
        <Icon name="trash" size={16} /> {t.settings.clearData}
      </button>
    </SettingsCard>
  );
}
