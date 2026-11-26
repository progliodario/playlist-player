/**
 * Opens the native player of the Android app (only meaningful when getShell() is
 * "android"). The link must be followed from a user gesture (a click), otherwise Chrome
 * ignores it. Payload format: src/domain/handoff-payload.ts.
 */
import { appConfig } from '../config/app-config.ts';
import { artistFromChannel } from '../domain/format.ts';
import { androidPlayerIntentUrl, buildHandoffPayload } from '../domain/handoff-payload.ts';
import type { QueueState } from '../domain/queue.ts';
import type { PlaylistKind } from '../domain/types.ts';

/** Starts `queue` in the native player. */
export function playInAndroidApp(
  queue: QueueState,
  options: { kind: PlaylistKind; positionSeconds: number; autoplay: boolean },
): void {
  const payload = buildHandoffPayload(queue, {
    ...options,
    artistOf: (track) => artistFromChannel(track.channelTitle),
  });
  navigate(androidPlayerIntentUrl(appConfig.android.applicationId, 'play', payload));
}

/** Shows the native player as it is (keeps what it is playing). */
export function openAndroidPlayer(): void {
  navigate(androidPlayerIntentUrl(appConfig.android.applicationId, 'open'));
}

function navigate(url: string): void {
  window.location.assign(url);
}
