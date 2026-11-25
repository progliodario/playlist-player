/**
 * Vite build configuration (dev server, production build, PWA, unit tests).
 *
 * Project identity (name, base path, colors) is NOT hard-coded here: it comes from
 * app.config.json so that one file controls the web app, the catalog script and the
 * Android wrapper. See docs/ARCHITECTURE.md.
 */
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import appConfig from './app.config.json' with { type: 'json' };
import pkg from './package.json' with { type: 'json' };

const BACKGROUND_COLOR = '#12101c';

export default defineConfig({
  base: appConfig.basePath,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered manually in src/app/pwa.ts
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: appConfig.basePath,
        name: appConfig.appName,
        short_name: appConfig.shortName,
        description: appConfig.description,
        lang: 'it',
        start_url: appConfig.basePath,
        scope: appConfig.basePath,
        display: 'standalone',
        orientation: 'any',
        theme_color: appConfig.themeColor,
        background_color: BACKGROUND_COLOR,
        categories: ['music', 'entertainment'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The catalog is data, not app shell: it is cached at runtime instead (see below).
        globIgnores: ['catalog/**'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Public playlist catalog generated at deploy time (public/catalog/*.json).
            urlPattern: ({ url }) => url.pathname.includes('/catalog/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'catalog', expiration: { maxEntries: 300 } },
          },
          {
            // Video and playlist thumbnails.
            urlPattern: ({ url }) => url.hostname === 'i.ytimg.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'thumbnails',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
