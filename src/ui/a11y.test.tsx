// @vitest-environment jsdom
/**
 * Automated accessibility checks (axe-core) on every page, rendered with realistic data.
 * They catch missing labels, wrong ARIA, invalid lists, duplicate ids, etc.
 * Color contrast is not computed by jsdom: it is covered by src/styles/contrast.test.ts.
 * Manual checks (keyboard, screen readers) are listed in docs/sviluppo/accessibilita.md.
 */
import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import type { ReactElement } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Playlist, PlaylistSummary, Track } from '../domain/types.ts';

vi.mock('virtual:pwa-register', () => ({ registerSW: () => () => undefined }));

const tracks: Track[] = [
  { videoId: 'xkVYAVdXx1A', title: 'scossa', channelTitle: 'sangiovanni', durationSeconds: 182 },
  { videoId: 'BoUML2eiUqg', title: 'non +', channelTitle: 'sangiovanni', durationSeconds: 153 },
  {
    videoId: 'UFy-DP0hyic',
    title: 'malibu',
    channelTitle: 'sangiovanni - Topic',
    durationSeconds: 167,
  },
];

const summary: PlaylistSummary = {
  key: 'catalog:PLTEST',
  source: 'catalog',
  id: 'PLTEST',
  title: 'sangiovanni',
  description: '',
  itemCount: tracks.length,
  thumbnailUrl: null,
  detectedKind: 'music',
  ownerName: 'Dario Proglio',
  updatedAt: '2026-11-22',
  totalDurationSeconds: 502,
};

const playlist: Playlist = { ...summary, tracks };

beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.open = false;
  };
  globalThis.fetch = vi.fn(() => Promise.reject(new Error('offline in tests'))) as typeof fetch;
});

afterEach(cleanup);

async function seedStores() {
  const { useLibraryStore } = await import('../state/library-store.ts');
  useLibraryStore.setState({
    sources: {
      catalog: { status: 'ready', playlists: [summary], error: null },
      account: { status: 'unavailable', playlists: [], error: null },
      manual: { status: 'ready', playlists: [], error: null },
    },
    details: { [summary.key]: { status: 'ready', playlist, error: null } },
    catalogVersion: 'test',
    catalogGeneratedAt: '2026-11-26T10:00:00Z',
  });
  const { usePlayerStore } = await import('../player/player-store.ts');
  const { createQueue } = await import('../domain/queue.ts');
  usePlayerStore.setState({
    queue: createQueue(tracks, { sourceKey: summary.key, sourceTitle: summary.title }),
    status: 'paused',
    playIntent: false,
  });
}

async function expectNoViolations(ui: ReactElement) {
  const { container } = render(<main>{ui}</main>);
  const result = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  const summaryOfViolations = result.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(summaryOfViolations).toEqual([]);
}

describe('accessibility (axe-core)', () => {
  it('library page', async () => {
    await seedStores();
    const { LibraryView } = await import('./views/LibraryView.tsx');
    await expectNoViolations(<LibraryView />);
  });

  it('playlist page', async () => {
    await seedStores();
    const { PlaylistView } = await import('./views/PlaylistView.tsx');
    await expectNoViolations(<PlaylistView playlistKey={summary.key} />);
  });

  it('now playing page and player panel', async () => {
    await seedStores();
    const { NowPlayingView } = await import('./views/NowPlayingView.tsx');
    const { NowPlayingPanel } = await import('./player/NowPlayingPanel.tsx');
    await expectNoViolations(
      <>
        <NowPlayingView />
        <NowPlayingPanel showQueue={false} />
      </>,
    );
  });

  it('settings page', async () => {
    await seedStores();
    const { SettingsView } = await import('./views/SettingsView.tsx');
    await expectNoViolations(<SettingsView />);
  });
});
