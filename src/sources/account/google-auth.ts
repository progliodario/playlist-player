/**
 * Google sign-in for the "account" source, using the Google Identity Services token
 * client (implicit flow, no backend). Read-only YouTube scope.
 *
 * Setup (one time, by the repository owner): docs/sviluppo/account-google.md
 *
 * In the Windows app Google does not allow signing in inside the app window, so the
 * desktop app opens the system browser instead (desktop/main/google-sign-in.cjs).
 */
import { getDesktopBridge } from '../../platform/shell.ts';
import { loadScript } from '../../utils/load-script.ts';

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
export const YOUTUBE_READONLY_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

export interface AccessToken {
  value: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

export function preloadGoogleIdentity(): Promise<void> {
  return loadScript(GIS_SCRIPT_URL);
}

/**
 * Opens the Google consent popup and resolves with an access token.
 * Must be called from a user gesture (click), otherwise browsers block the popup.
 */
export async function requestAccessToken(
  clientId: string,
  prompt: '' | 'consent' | 'select_account' = '',
): Promise<AccessToken> {
  const desktop = getDesktopBridge();
  if (desktop) {
    const token = await desktop.signIn({ clientId, scope: YOUTUBE_READONLY_SCOPE, prompt });
    return { value: token.accessToken, expiresAt: Date.now() + token.expiresIn * 1000 };
  }
  await preloadGoogleIdentity();
  return new Promise<AccessToken>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: YOUTUBE_READONLY_SCOPE,
      prompt,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description ?? response.error ?? 'No token'));
          return;
        }
        resolve({
          value: response.access_token,
          expiresAt: Date.now() + Number(response.expires_in) * 1000,
        });
      },
      error_callback: (error) => reject(new Error(error.message ?? error.type)),
    });
    client.requestAccessToken();
  });
}

export async function revokeAccessToken(token: string): Promise<void> {
  try {
    await preloadGoogleIdentity();
    await new Promise<void>((resolve) => google.accounts.oauth2.revoke(token, resolve));
  } catch {
    // Revocation is best effort: the token expires within an hour anyway.
  }
}
