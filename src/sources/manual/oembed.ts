/**
 * YouTube oEmbed: public metadata (title, author) without API key or sign-in.
 * The endpoint allows cross-origin requests.
 */
import { playlistUrl, videoUrl } from '../../domain/youtube-urls.ts';

export interface OEmbedInfo {
  title: string;
  authorName: string;
}

const OEMBED_ENDPOINT = 'https://www.youtube.com/oembed';

export function fetchVideoOEmbed(videoId: string): Promise<OEmbedInfo | null> {
  return fetchOEmbed(videoUrl(videoId));
}

export function fetchPlaylistOEmbed(playlistId: string): Promise<OEmbedInfo | null> {
  return fetchOEmbed(playlistUrl(playlistId));
}

async function fetchOEmbed(targetUrl: string): Promise<OEmbedInfo | null> {
  const url = `${OEMBED_ENDPOINT}?format=json&url=${encodeURIComponent(targetUrl)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null; // 401/403: private, 404: not found
    const data = (await response.json()) as { title?: string; author_name?: string };
    return { title: data.title ?? '', authorName: data.author_name ?? '' };
  } catch {
    return null;
  }
}
