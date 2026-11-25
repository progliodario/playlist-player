import { useEffect, useState, type ReactNode } from 'react';
import {
  clearLocalData,
  removeManualPlaylist,
  signInWithGoogle,
  signOutOfGoogle,
} from '../../app/actions.ts';
import { promptInstall, useInstallStore } from '../../app/pwa.ts';
import { APP_VERSION, appConfig, BUILD_TIME } from '../../config/app-config.ts';
import { formatDate, useStrings } from '../../i18n/index.ts';
import { useAuthStore } from '../../sources/account/auth-store.ts';
import { preloadGoogleIdentity } from '../../sources/account/google-auth.ts';
import { loadCatalogIndex } from '../../sources/catalog/catalog-source.ts';
import { useLibraryStore } from '../../state/library-store.ts';
import {
  useOAuthClientId,
  useSettingsStore,
  type LanguageSetting,
  type ThemeSetting,
} from '../../state/settings-store.ts';
import { SegmentedControl } from '../components/SegmentedControl.tsx';
import { Icon } from '../icons.tsx';

const DOCS_URL = `${appConfig.repositoryUrl}/blob/main/docs`;

export function SettingsView() {
  const t = useStrings();
  return (
    <div className="view settings">
      <h1 className="view__title">{t.settings.title}</h1>
      <AppearanceSection />
      <AccountSection />
      <LibrarySettingsSection />
      <InstallSection />
      <AboutSection />
    </div>
  );
}

function SettingsCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="settings-card">
      <h2>{title}</h2>
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
    <SettingsCard title={t.settings.appearance}>
      <div className="settings-row">
        <span>{t.settings.language}</span>
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
        <span>{t.settings.theme}</span>
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

  useEffect(() => {
    if (clientId) void preloadGoogleIdentity().catch(() => undefined);
  }, [clientId]);

  return (
    <SettingsCard title={t.settings.account}>
      <p className="muted">{t.settings.accountIntro}</p>

      {!clientId && (
        <p className="notice">
          {t.settings.notConfigured}{' '}
          <a href={`${DOCS_URL}/GOOGLE-OAUTH-SETUP.md`} target="_blank" rel="noreferrer">
            {t.settings.setupGuide}
          </a>
        </p>
      )}

      {clientId && (
        <div className="settings-row">
          <span className="account-status">
            {status === 'signed-in' && profile?.avatarUrl && (
              <img
                src={profile.avatarUrl}
                alt=""
                width={32}
                height={32}
                referrerPolicy="no-referrer"
              />
            )}
            {status === 'signed-in'
              ? profile?.name
                ? t.settings.signedInAs(profile.name)
                : t.settings.signedIn
              : status === 'expired'
                ? t.settings.expired
                : status === 'signing-in'
                  ? t.settings.signingIn
                  : ''}
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
              {t.settings.signIn}
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
          <input
            className="text-input"
            value={draft}
            placeholder={appConfig.google.oauthClientId || '1234-abc.apps.googleusercontent.com'}
            aria-label={t.settings.clientIdLabel}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" className="button">
            {t.settings.save}
          </button>
        </form>
        <p className="muted small">{t.settings.clientIdHelp}</p>
      </details>
    </SettingsCard>
  );
}

function LibrarySettingsSection() {
  const t = useStrings();
  const manual = useSettingsStore((s) => s.manualPlaylists);
  const overrides = useSettingsStore((s) => s.kindOverrides);
  const loadAllSources = useLibraryStore((s) => s.loadAllSources);
  const [catalogDate, setCatalogDate] = useState<string | null>(null);
  const overrideCount = Object.keys(overrides).length;

  useEffect(() => {
    loadCatalogIndex()
      .then((index) => setCatalogDate(index.generatedAt))
      .catch(() => setCatalogDate(null));
  }, []);

  return (
    <SettingsCard title={t.settings.library}>
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
      <div className="settings-row">
        <span className="muted">
          {catalogDate ? t.settings.catalogGenerated(formatDate(catalogDate, t.locale)) : ''}
        </span>
        <button type="button" className="button button--small" onClick={loadAllSources}>
          {t.settings.reloadLibrary}
        </button>
      </div>
    </SettingsCard>
  );
}

function InstallSection() {
  const t = useStrings();
  const promptEvent = useInstallStore((s) => s.promptEvent);
  const isInstalled = useInstallStore((s) => s.isInstalled);
  return (
    <SettingsCard title={t.settings.install}>
      {isInstalled ? (
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
      <a href={`${appConfig.repositoryUrl}/releases/latest`} target="_blank" rel="noreferrer">
        {t.settings.releasesLink}
      </a>
    </SettingsCard>
  );
}

function AboutSection() {
  const t = useStrings();
  return (
    <SettingsCard title={t.settings.about}>
      <p>{t.settings.version(APP_VERSION, formatDate(BUILD_TIME, t.locale))}</p>
      <p>
        <a href={appConfig.repositoryUrl} target="_blank" rel="noreferrer">
          {t.settings.sourceCode}
        </a>
      </p>
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
