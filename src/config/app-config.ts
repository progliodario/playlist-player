/**
 * Typed access to app.config.json (the single source of project identity) plus
 * build-time constants. Import config from here, never from the JSON file directly.
 */
import rawConfig from '../../app.config.json';
import type { PlaylistKind } from '../domain/types.ts';

export interface AppConfig {
  appName: string;
  shortName: string;
  description: string;
  themeColor: string;
  /** Path the site is served from, with leading and trailing slash, e.g. "/playlist-player/". */
  basePath: string;
  /** Absolute URL of the deployed site. */
  publicUrl: string;
  repositoryUrl: string;
  youtube: {
    /** Channel whose public playlists form the catalog, e.g. "@DarioProglio". */
    channelHandle: string;
    /** Extra public playlists (of any channel) to include in the catalog. */
    extraPlaylistIds: string[];
    /** Channel playlists to leave out of the catalog. */
    excludedPlaylistIds: string[];
    /** Force music/video for specific playlist ids (catalog only). */
    kindOverrides: Record<string, PlaylistKind>;
  };
  google: {
    /** OAuth 2.0 Web client id. Empty string = account sign-in disabled. Not a secret. */
    oauthClientId: string;
  };
  android: {
    applicationId: string;
    versionCode: number;
    versionName: string;
  };
}

export const appConfig: AppConfig = rawConfig as AppConfig;

export const APP_VERSION: string = __APP_VERSION__;
export const BUILD_TIME: string = __BUILD_TIME__;

/** Absolute-path prefix for files in public/, e.g. "/playlist-player/". */
export const BASE_URL: string = import.meta.env.BASE_URL;
