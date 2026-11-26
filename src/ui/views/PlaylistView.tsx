import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { playPlaylistByKey, playTrackOfPlaylist, removeManualPlaylist } from '../../app/actions.ts';
import { navigate, routeHref } from '../../app/router.ts';
import { matchesSearch } from '../../domain/format.ts';
import { currentTrackIndex } from '../../domain/queue.ts';
import type { PlaylistKind } from '../../domain/types.ts';
import { playlistUrl, videoThumbnailUrl } from '../../domain/youtube-urls.ts';
import { formatDate, formatLongDuration, useStrings } from '../../i18n/index.ts';
import { usePlayerStore } from '../../player/player-store.ts';
import { useAuthStore } from '../../sources/account/auth-store.ts';
import { useEffectiveKind, useLibraryStore, useSummary } from '../../state/library-store.ts';
import { useSettingsStore } from '../../state/settings-store.ts';
import { hueFromString } from '../art/art-math.ts';
import { Vinyl } from '../art/Vinyl.tsx';
import { ExternalLink } from '../components/ExternalLink.tsx';
import { SearchField } from '../components/SearchField.tsx';
import { SegmentedControl } from '../components/SegmentedControl.tsx';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { Thumbnail } from '../components/Thumbnail.tsx';
import { TrackRow } from '../components/TrackRow.tsx';
import { joinMeta, playlistTitle, trackSubtitle } from '../display.ts';
import { Icon } from '../icons.tsx';

type KindChoice = 'auto' | PlaylistKind;

/** One playlist: illustrated header (sleeve + record), actions, searchable track list. */
export function PlaylistView({ playlistKey }: { playlistKey: string }) {
  const t = useStrings();
  const detail = useLibraryStore((s) => s.details[playlistKey]);
  const loadPlaylist = useLibraryStore((s) => s.loadPlaylist);
  const summary = useSummary(playlistKey);
  const override = useSettingsStore((s) => s.kindOverrides[playlistKey]);
  const setKindOverride = useSettingsStore((s) => s.setKindOverride);
  const signedIn = useAuthStore((s) => s.status === 'signed-in');
  const [query, setQuery] = useState('');

  const queue = usePlayerStore((s) => s.queue);
  const playing = usePlayerStore((s) => s.playIntent);
  const failed = usePlayerStore((s) => s.failedVideoIds);

  useEffect(() => setQuery(''), [playlistKey]);
  // Load when missing (first visit, or after a catalog refresh dropped the cached tracks).
  useEffect(() => {
    if (!detail) void loadPlaylist(playlistKey);
  }, [playlistKey, detail, loadPlaylist]);

  const playlist = detail?.playlist ?? null;
  const base = playlist ?? summary;
  const kind = useEffectiveKind(base);

  const rows = useMemo(() => {
    const tracks = playlist?.tracks ?? [];
    return tracks
      .map((track, index) => ({ track, index }))
      .filter(({ track }) => matchesSearch(`${track.title} ${trackSubtitle(track)}`, query));
  }, [playlist, query]);

  if (!base) {
    return (
      <div className="view">
        {detail?.status === 'error' ? (
          <StatusMessage
            tone="error"
            art
            action={
              <a className="button" href={routeHref({ name: 'library' })}>
                {t.playlist.back}
              </a>
            }
          >
            {t.playlist.notFound}
          </StatusMessage>
        ) : (
          <StatusMessage tone="loading">{t.playlist.loading}</StatusMessage>
        )}
      </div>
    );
  }

  const title = playlistTitle(base, t);
  const hue = hueFromString(playlistKey);
  const isQueueSource = queue?.sourceKey === playlistKey;
  const playingIndex = isQueueSource && queue ? currentTrackIndex(queue) : -1;
  const cover =
    base.thumbnailUrl ??
    (playlist?.tracks[0] ? videoThumbnailUrl(playlist.tracks[0].videoId, 'hq') : null);
  const kindChoice: KindChoice = override ?? 'auto';

  return (
    <div
      className={`view playlist-view playlist-view--${kind}`}
      style={{ '--hue': hue, '--cover': cover ? `url("${cover}")` : 'none' } as CSSProperties}
    >
      <div className="playlist-view__backdrop" aria-hidden="true" />

      <a className="back-link" href={routeHref({ name: 'library' })}>
        <Icon name="back" size={18} /> {t.playlist.back}
      </a>

      <header className="playlist-hero">
        <div className={`playlist-hero__art playlist-hero__art--${kind}`}>
          {kind === 'music' && (
            <Vinyl hue={hue} spinning={isQueueSource && playing} className="playlist-hero__vinyl" />
          )}
          <Thumbnail src={cover} kind={kind} shape="square" className="playlist-hero__cover" />
        </div>
        <div className="playlist-hero__body">
          <p className="playlist-hero__kind">
            <Icon name={kind === 'music' ? 'music' : 'video'} size={16} />
            {kind === 'music' ? t.playlist.kindMusic : t.playlist.kindVideo}
          </p>
          <h1 className="playlist-hero__title" tabIndex={-1}>
            {title}
          </h1>
          {base.description && <p className="playlist-hero__description">{base.description}</p>}
          <p className="playlist-hero__meta">
            {joinMeta(
              base.ownerName,
              base.itemCount > 0 && t.library.itemCount(base.itemCount, kind),
              formatLongDuration(base.totalDurationSeconds),
              base.updatedAt && t.playlist.updatedOn(formatDate(base.updatedAt, t.locale)),
            )}
          </p>
          <div className="playlist-hero__actions">
            <button
              type="button"
              className="button button--primary button--large"
              disabled={!playlist}
              onClick={() => void playPlaylistByKey(playlistKey)}
            >
              <Icon name="play" size={20} /> {t.playlist.play}
            </button>
            <button
              type="button"
              className="button button--large"
              disabled={!playlist}
              onClick={() => void playPlaylistByKey(playlistKey, { shuffle: true })}
            >
              <Icon name="shuffle" size={20} /> {t.playlist.shuffle}
            </button>
            <ExternalLink className="button button--ghost" href={playlistUrl(base.id)}>
              <Icon name="external" size={18} /> {t.playlist.openOnYouTube}
            </ExternalLink>
            {base.source === 'manual' && (
              <button
                type="button"
                className="button button--ghost button--danger"
                onClick={() => {
                  void removeManualPlaylist(base.id);
                  navigate({ name: 'library' });
                }}
              >
                <Icon name="trash" size={18} /> {t.playlist.remove}
              </button>
            )}
          </div>
          <div className="playlist-hero__kind-choice">
            {/* Visible caption; the radio group carries the same text as its label. */}
            <span aria-hidden="true">{t.playlist.kindLabel}</span>
            <SegmentedControl<KindChoice>
              label={t.playlist.kindLabel}
              value={kindChoice}
              onChange={(choice) => setKindOverride(playlistKey, choice === 'auto' ? null : choice)}
              options={[
                { value: 'auto', label: t.playlist.kindAuto },
                { value: 'music', label: t.playlist.kindMusic },
                { value: 'video', label: t.playlist.kindVideo },
              ]}
            />
          </div>
        </div>
      </header>

      {base.source === 'manual' && !signedIn && (
        <p className="section-hint">{t.playlist.signedOutLimit}</p>
      )}

      {detail?.status === 'loading' && !playlist && (
        <StatusMessage tone="loading">{t.playlist.loading}</StatusMessage>
      )}
      {detail?.status === 'error' && (
        <StatusMessage
          tone="error"
          action={
            <button
              type="button"
              className="button"
              onClick={() => void loadPlaylist(playlistKey, true)}
            >
              {t.common.retry}
            </button>
          }
        >
          {detail.error === 'empty-or-private' ? t.playlist.emptyOrPrivate : t.playlist.loadError}
        </StatusMessage>
      )}

      {playlist && (
        <section className="playlist-view__tracks" aria-labelledby="tracks-heading">
          <div className="playlist-view__tracks-header">
            <h2 id="tracks-heading" className="section-title">
              {t.playlist.tracksHeading}
              <span className="library-section__count">{playlist.tracks.length}</span>
            </h2>
            {playlist.tracks.length > 8 && (
              <SearchField value={query} onChange={setQuery} label={t.playlist.searchPlaceholder} />
            )}
          </div>
          {query && (
            <p className="visually-hidden" role="status">
              {rows.length === 0
                ? t.playlist.noTrackResults
                : t.library.itemCount(rows.length, kind)}
            </p>
          )}
          {rows.length === 0 && query && <StatusMessage>{t.playlist.noTrackResults}</StatusMessage>}
          <ol className="track-list">
            {rows.map(({ track, index }) => (
              <TrackRow
                key={`${index}-${track.videoId}`}
                track={track}
                index={index + 1}
                kind={kind}
                isCurrent={index === playingIndex}
                isPlaying={playing}
                isUnplayable={failed.includes(track.videoId)}
                onPlay={() => void playTrackOfPlaylist(playlistKey, index)}
              />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
