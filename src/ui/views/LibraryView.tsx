import { useMemo, useState, type ReactNode } from 'react';
import { signInWithGoogle } from '../../app/actions.ts';
import { appConfig } from '../../config/app-config.ts';
import { matchesSearch } from '../../domain/format.ts';
import type { PlaylistKind, PlaylistSummary, SourceKind } from '../../domain/types.ts';
import { useStrings, type Strings } from '../../i18n/index.ts';
import { useAuthStore } from '../../sources/account/auth-store.ts';
import { SOURCE_ORDER } from '../../sources/registry.ts';
import { useLibraryStore, type SourceState } from '../../state/library-store.ts';
import {
  useOAuthClientId,
  useSettingsStore,
  type LibraryFilter,
  type LibrarySort,
} from '../../state/settings-store.ts';
import { AddPlaylistDialog } from '../components/AddPlaylistDialog.tsx';
import { PlaylistCard } from '../components/PlaylistCard.tsx';
import { SearchField } from '../components/SearchField.tsx';
import { SegmentedControl } from '../components/SegmentedControl.tsx';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { playlistTitle } from '../display.ts';
import { Icon } from '../icons.tsx';

export function LibraryView() {
  const t = useStrings();
  const sources = useLibraryStore((s) => s.sources);
  const loadSource = useLibraryStore((s) => s.loadSource);
  const filter = useSettingsStore((s) => s.libraryFilter);
  const sort = useSettingsStore((s) => s.librarySort);
  const kindOverrides = useSettingsStore((s) => s.kindOverrides);
  const { setLibraryFilter, setLibrarySort } = useSettingsStore.getState();
  const clientId = useOAuthClientId();
  const authStatus = useAuthStore((s) => s.status);
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const visibleBySource = useMemo(() => {
    const select = (playlists: PlaylistSummary[]) => {
      const filtered = playlists.filter((p) => {
        const kind: PlaylistKind = kindOverrides[p.key] ?? p.detectedKind;
        if (filter !== 'all' && kind !== filter) return false;
        return matchesSearch(playlistTitle(p, t), query);
      });
      return sortPlaylists(filtered, sort, t);
    };
    return Object.fromEntries(
      SOURCE_ORDER.map((kind) => [kind, select(sources[kind].playlists)]),
    ) as Record<SourceKind, PlaylistSummary[]>;
  }, [sources, filter, sort, query, kindOverrides, t]);

  const isFiltering = query.trim() !== '' || filter !== 'all';
  const totalVisible = SOURCE_ORDER.reduce((n, kind) => n + visibleBySource[kind].length, 0);
  const anyReady = SOURCE_ORDER.some((kind) => sources[kind].status === 'ready');

  return (
    <div className="view library">
      <header className="view__header">
        <h1>{t.library.title}</h1>
        <div className="library__toolbar">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder={t.library.searchPlaceholder}
          />
          <SegmentedControl<LibraryFilter>
            label={t.library.title}
            value={filter}
            onChange={setLibraryFilter}
            options={[
              { value: 'all', label: t.library.filterAll },
              { value: 'music', label: t.library.filterMusic },
              { value: 'video', label: t.library.filterVideo },
            ]}
          />
          <label className="select">
            <span className="visually-hidden">{t.library.sortLabel}</span>
            <select value={sort} onChange={(e) => setLibrarySort(e.target.value as LibrarySort)}>
              <option value="default">{t.library.sortDefault}</option>
              <option value="title">{t.library.sortTitle}</option>
              <option value="size">{t.library.sortSize}</option>
              <option value="recent">{t.library.sortRecent}</option>
            </select>
          </label>
        </div>
      </header>

      {isFiltering && anyReady && totalVisible === 0 && (
        <StatusMessage>{t.library.noResults}</StatusMessage>
      )}

      {SOURCE_ORDER.map((kind) => {
        if (kind === 'account' && !clientId) return null;
        const state = sources[kind];
        const visible = visibleBySource[kind];
        if (isFiltering && visible.length === 0 && state.status === 'ready') return null;

        return (
          <LibrarySection
            key={kind}
            title={sectionTitle(kind, t)}
            count={state.status === 'ready' ? visible.length : null}
            action={
              kind === 'manual' ? (
                <button
                  type="button"
                  className="button button--small"
                  onClick={() => setAddOpen(true)}
                >
                  <Icon name="plus" size={16} /> {t.library.addPlaylist}
                </button>
              ) : null
            }
          >
            <SectionBody
              kind={kind}
              state={state}
              visible={visible}
              authStatus={authStatus}
              onRetry={() => void loadSource(kind)}
            />
          </LibrarySection>
        );
      })}

      <AddPlaylistDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function SectionBody({
  kind,
  state,
  visible,
  authStatus,
  onRetry,
}: {
  kind: SourceKind;
  state: SourceState;
  visible: PlaylistSummary[];
  authStatus: string;
  onRetry: () => void;
}) {
  const t = useStrings();

  if (kind === 'account' && state.status === 'unavailable') {
    const expired = authStatus === 'expired';
    return (
      <div className="hint-card">
        <Icon name="account" size={28} />
        <p>{expired ? t.library.accountExpiredHint : t.library.accountSignedOutHint}</p>
        <button
          type="button"
          className="button button--primary"
          onClick={() => void signInWithGoogle()}
        >
          {expired ? t.library.reconnect : t.library.signIn}
        </button>
      </div>
    );
  }
  if (state.status === 'loading' || state.status === 'idle') return <SkeletonGrid />;
  if (state.status === 'error') {
    return (
      <StatusMessage
        tone="error"
        action={
          <button type="button" className="button" onClick={onRetry}>
            {t.common.retry}
          </button>
        }
      >
        {kind === 'catalog' ? t.library.catalogError : t.library.accountError}
      </StatusMessage>
    );
  }
  if (kind === 'manual' && state.playlists.length === 0) {
    return <p className="muted section-hint">{t.library.manualEmptyHint}</p>;
  }
  return (
    <div className="playlist-grid">
      {visible.map((playlist) => (
        <PlaylistCard key={playlist.key} playlist={playlist} />
      ))}
    </div>
  );
}

function LibrarySection({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count: number | null;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="library-section">
      <header className="library-section__header">
        <h2>
          {title}
          {count !== null && <span className="library-section__count">{count}</span>}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div className="playlist-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="playlist-card playlist-card--skeleton">
          <div className="thumb thumb--square skeleton" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line skeleton--short" />
        </div>
      ))}
    </div>
  );
}

function sectionTitle(kind: SourceKind, t: Strings): string {
  switch (kind) {
    case 'account':
      return t.library.sectionAccount;
    case 'catalog':
      return t.library.sectionCatalog(appConfig.youtube.channelHandle);
    case 'manual':
      return t.library.sectionManual;
  }
}

function sortPlaylists(
  playlists: PlaylistSummary[],
  sort: LibrarySort,
  t: Strings,
): PlaylistSummary[] {
  const sorted = [...playlists];
  switch (sort) {
    case 'title':
      return sorted.sort((a, b) =>
        playlistTitle(a, t).localeCompare(playlistTitle(b, t), t.locale, { sensitivity: 'base' }),
      );
    case 'size':
      return sorted.sort((a, b) => b.itemCount - a.itemCount);
    case 'recent':
      return sorted.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
    default:
      return sorted;
  }
}
