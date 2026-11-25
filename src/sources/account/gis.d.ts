/**
 * Minimal type declarations for the Google Identity Services OAuth 2.0 token client
 * (https://accounts.google.com/gsi/client). Only what src/sources/account/ uses.
 * Reference: https://developers.google.com/identity/oauth2/web/reference/js-reference
 */
declare namespace google.accounts.oauth2 {
  interface TokenResponse {
    access_token: string;
    expires_in: number | string;
    scope: string;
    error?: string;
    error_description?: string;
  }

  interface ClientConfigError {
    type: 'popup_failed_to_open' | 'popup_closed' | 'unknown' | string;
    message?: string;
  }

  interface TokenClientConfig {
    client_id: string;
    scope: string;
    prompt?: '' | 'none' | 'consent' | 'select_account';
    callback: (response: TokenResponse) => void;
    error_callback?: (error: ClientConfigError) => void;
  }

  interface TokenClient {
    requestAccessToken(overrides?: { prompt?: TokenClientConfig['prompt'] }): void;
  }

  function initTokenClient(config: TokenClientConfig): TokenClient;
  function revoke(accessToken: string, done?: () => void): void;
}
