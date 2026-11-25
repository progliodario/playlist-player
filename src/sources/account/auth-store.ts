/**
 * Sign-in state for the "account" source.
 *
 * The access token is kept in localStorage until it expires (max 1 hour) so that
 * reopening the app shortly after does not ask to sign in again. The scope is
 * read-only. Signing out revokes the token.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getOAuthClientId } from '../../state/settings-store.ts';
import { STORAGE_KEYS } from '../../state/storage-keys.ts';
import { requestAccessToken, revokeAccessToken } from './google-auth.ts';
import { fetchMyChannel, type ChannelProfile } from './youtube-data-api.ts';

/** Refuse tokens that expire within this margin. */
const EXPIRY_MARGIN_MS = 60_000;

export type AuthStatus = 'signed-out' | 'signing-in' | 'signed-in' | 'expired' | 'error';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  expiresAt: number;
  profile: ChannelProfile | null;
  error: string | null;
  /** True once the user signed in at least once on this device (enables "reconnect"). */
  hasSignedInBefore: boolean;

  signIn(): Promise<void>;
  signOut(): Promise<void>;
  /** Marks the session expired (e.g. after an HTTP 401). */
  markExpired(): void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: 'signed-out',
      accessToken: null,
      expiresAt: 0,
      profile: null,
      error: null,
      hasSignedInBefore: false,

      async signIn() {
        const clientId = getOAuthClientId();
        if (!clientId) {
          set({ status: 'error', error: 'missing-client-id' });
          return;
        }
        set({ status: 'signing-in', error: null });
        try {
          const prompt = get().hasSignedInBefore ? '' : 'consent';
          const token = await requestAccessToken(clientId, prompt);
          set({ accessToken: token.value, expiresAt: token.expiresAt });
          const profile = await fetchMyChannel(token.value).catch(() => null);
          set({ status: 'signed-in', profile, hasSignedInBefore: true });
        } catch (error) {
          set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      },

      async signOut() {
        const token = get().accessToken;
        set({ status: 'signed-out', accessToken: null, expiresAt: 0, profile: null, error: null });
        if (token) await revokeAccessToken(token);
      },

      markExpired() {
        set({ status: 'expired', accessToken: null, expiresAt: 0 });
      },
    }),
    {
      name: STORAGE_KEYS.auth,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        expiresAt: s.expiresAt,
        profile: s.profile,
        hasSignedInBefore: s.hasSignedInBefore,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const valid = state.accessToken && state.expiresAt - EXPIRY_MARGIN_MS > Date.now();
        useAuthStore.setState(
          valid
            ? { status: 'signed-in' }
            : {
                status: state.hasSignedInBefore ? 'expired' : 'signed-out',
                accessToken: null,
                expiresAt: 0,
              },
        );
      },
    },
  ),
);

/** Returns a usable access token, or null (and flags the session as expired). */
export function getValidAccessToken(): string | null {
  const { accessToken, expiresAt, status, markExpired } = useAuthStore.getState();
  if (!accessToken || status !== 'signed-in') return null;
  if (expiresAt - EXPIRY_MARGIN_MS <= Date.now()) {
    markExpired();
    return null;
  }
  return accessToken;
}
