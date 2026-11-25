/**
 * Reads the video ids of a public playlist WITHOUT sign-in or API key, by cueing the
 * playlist in a temporary, never-played YouTube player and calling getPlaylist().
 *
 * Limitation: the embedded player exposes at most ~200 videos of a playlist.
 * When the user is signed in, the manual source uses the Data API instead (no limit).
 */
import { basePlayerVars, loadYouTubeIframeApi, YT_STATE } from '../../player/youtube-iframe-api.ts';

const TIMEOUT_MS = 15_000;
const POLL_MS = 250;

export async function resolvePlaylistVideoIds(playlistId: string): Promise<string[]> {
  const api = await loadYouTubeIframeApi();

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:200px;height:200px;pointer-events:none;';
  const target = document.createElement('div');
  host.appendChild(target);
  document.body.appendChild(host);

  let player: YT.Player | null = null;
  try {
    return await new Promise<string[]>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS);
      let poll = 0;
      const tryRead = () => {
        const ids = player?.getPlaylist?.();
        if (ids && ids.length > 0) {
          window.clearTimeout(timeout);
          window.clearInterval(poll);
          resolve(ids);
        }
      };
      player = new api.Player(target, {
        width: 200,
        height: 200,
        playerVars: { ...basePlayerVars(), mute: 1 },
        events: {
          onReady: (event) => {
            event.target.cuePlaylist({ list: playlistId, listType: 'playlist' });
            poll = window.setInterval(tryRead, POLL_MS);
          },
          onStateChange: (event) => {
            if (event.data === YT_STATE.CUED) tryRead();
          },
          onError: () => {
            window.clearTimeout(timeout);
            window.clearInterval(poll);
            reject(new Error('player-error'));
          },
        },
      });
    });
  } finally {
    try {
      (player as YT.Player | null)?.destroy();
    } catch {
      // ignore
    }
    host.remove();
  }
}
