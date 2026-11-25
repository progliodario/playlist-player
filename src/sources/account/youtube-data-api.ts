/**
 * Thin client for the YouTube Data API v3 (read-only calls used by the app).
 * Docs: https://developers.google.com/youtube/v3/docs
 *
 * Quota: every call below costs 1 unit; the default daily quota is 10,000 units.
 */
import { parseIsoDuration } from '../../domain/format.ts';
import type { Track } from '../../domain/types.ts';

const API_BASE = 'https://www.googleapis.com/youtube/v3';
const PAGE_SIZE = 50;
/** Safety cap to avoid runaway pagination (50 * 100 = 5000 items). */
const MAX_PAGES = 100;

export class YouTubeApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'YouTubeApiError';
    this.status = status;
  }
}

// --- response shapes (only the fields we read) ------------------------------------

interface Thumbnails {
  default?: { url: string };
  medium?: { url: string };
  high?: { url: string };
}

interface ApiPage<T> {
  items?: T[];
  nextPageToken?: string;
  pageInfo?: { totalResults?: number };
}

interface ApiPlaylist {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelTitle?: string;
    thumbnails?: Thumbnails;
  };
  contentDetails?: { itemCount?: number };
}

interface ApiPlaylistItem {
  snippet?: {
    title?: string;
    videoOwnerChannelTitle?: string;
    resourceId?: { videoId?: string };
  };
  status?: { privacyStatus?: string };
}

interface ApiVideo {
  id: string;
  contentDetails?: { duration?: string };
}

interface ApiChannel {
  snippet?: { title?: string; thumbnails?: Thumbnails };
  contentDetails?: { relatedPlaylists?: { likes?: string } };
}

// --- public types -----------------------------------------------------------------

export interface ChannelProfile {
  name: string;
  avatarUrl: string | null;
  /** Id of the "liked videos" playlist (usually "LL"), if exposed. */
  likesPlaylistId: string | null;
}

export interface ApiPlaylistInfo {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  thumbnailUrl: string | null;
  updatedAt: string | null;
  ownerName: string | null;
}

// --- calls --------------------------------------------------------------------------

export async function fetchMyChannel(token: string): Promise<ChannelProfile | null> {
  const page = await apiGet<ApiPage<ApiChannel>>(token, 'channels', {
    part: 'snippet,contentDetails',
    mine: 'true',
  });
  const channel = page.items?.[0];
  if (!channel) return null;
  return {
    name: channel.snippet?.title ?? '',
    avatarUrl: channel.snippet?.thumbnails?.default?.url ?? null,
    likesPlaylistId: channel.contentDetails?.relatedPlaylists?.likes ?? null,
  };
}

/** All playlists owned by the signed-in user (public, unlisted and private). */
export async function fetchMyPlaylists(token: string): Promise<ApiPlaylistInfo[]> {
  const items = await fetchAllPages<ApiPlaylist>(token, 'playlists', {
    part: 'snippet,contentDetails',
    mine: 'true',
  });
  return items.map(toPlaylistInfo);
}

export async function fetchPlaylistInfo(
  token: string,
  id: string,
): Promise<ApiPlaylistInfo | null> {
  const page = await apiGet<ApiPage<ApiPlaylist>>(token, 'playlists', {
    part: 'snippet,contentDetails',
    id,
  });
  const item = page.items?.[0];
  return item ? toPlaylistInfo(item) : null;
}

/** Number of items of a playlist, read from the first page (used for "liked videos"). */
export async function fetchPlaylistItemCount(token: string, playlistId: string): Promise<number> {
  const page = await apiGet<ApiPage<ApiPlaylistItem>>(token, 'playlistItems', {
    part: 'id',
    playlistId,
    maxResults: '1',
  });
  return page.pageInfo?.totalResults ?? 0;
}

/** Playable tracks of a playlist, with durations. Private/deleted videos are skipped. */
export async function fetchPlaylistTracks(token: string, playlistId: string): Promise<Track[]> {
  const items = await fetchAllPages<ApiPlaylistItem>(token, 'playlistItems', {
    part: 'snippet,status',
    playlistId,
  });
  const tracks: Track[] = [];
  for (const item of items) {
    const videoId = item.snippet?.resourceId?.videoId;
    const privacy = item.status?.privacyStatus;
    if (!videoId || privacy === 'private' || privacy === 'privacyStatusUnspecified') continue;
    if (!item.snippet?.videoOwnerChannelTitle) continue; // deleted videos have no owner
    tracks.push({
      videoId,
      title: item.snippet.title ?? '',
      channelTitle: item.snippet.videoOwnerChannelTitle,
      durationSeconds: null,
    });
  }
  const durations = await fetchDurations(
    token,
    tracks.map((t) => t.videoId),
  );
  return tracks.map((t) => ({ ...t, durationSeconds: durations.get(t.videoId) ?? null }));
}

async function fetchDurations(token: string, videoIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  for (let i = 0; i < videoIds.length; i += PAGE_SIZE) {
    const page = await apiGet<ApiPage<ApiVideo>>(token, 'videos', {
      part: 'contentDetails',
      id: videoIds.slice(i, i + PAGE_SIZE).join(','),
      maxResults: String(PAGE_SIZE),
    });
    for (const video of page.items ?? []) {
      const seconds = parseIsoDuration(video.contentDetails?.duration);
      if (seconds !== null) result.set(video.id, seconds);
    }
  }
  return result;
}

// --- plumbing -------------------------------------------------------------------------

function toPlaylistInfo(item: ApiPlaylist): ApiPlaylistInfo {
  const thumbs = item.snippet?.thumbnails;
  return {
    id: item.id,
    title: item.snippet?.title ?? item.id,
    description: item.snippet?.description ?? '',
    itemCount: item.contentDetails?.itemCount ?? 0,
    thumbnailUrl: thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? null,
    updatedAt: item.snippet?.publishedAt ?? null,
    ownerName: item.snippet?.channelTitle ?? null,
  };
}

async function fetchAllPages<T>(
  token: string,
  resource: string,
  params: Record<string, string>,
): Promise<T[]> {
  const all: T[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await apiGet<ApiPage<T>>(token, resource, {
      ...params,
      maxResults: String(PAGE_SIZE),
      ...(pageToken ? { pageToken } : {}),
    });
    all.push(...(response.items ?? []));
    pageToken = response.nextPageToken;
    if (!pageToken) break;
  }
  return all;
}

async function apiGet<T>(
  token: string,
  resource: string,
  params: Record<string, string>,
): Promise<T> {
  const url = `${API_BASE}/${resource}?${new URLSearchParams(params).toString()}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // keep the generic message
    }
    throw new YouTubeApiError(response.status, message);
  }
  return (await response.json()) as T;
}
