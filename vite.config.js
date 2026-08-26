import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Precache the app shell (JS/CSS/fonts) and cache media on first use, so
    // repeat visits skip the network for ~everything.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,ico}', 'favicon*.png', 'apple-touch-icon.png', 'logos/*.png'],
        // help articles (52 HTML + 12MB screenshots/videos) are synced from the
        // Mynt app — runtime-cached on first open, never precached
        globIgnores: ['**/help-articles/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/help-articles\//],
        runtimeCaching: [
          {
            urlPattern: /\/(help-articles|help-thumbs)\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'help-articles',
              rangeRequests: true,
              expiration: { maxEntries: 400, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // videos stream via range requests — cache-first once fetched
            urlPattern: /\/videos\/.*\.mp4$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'videos',
              rangeRequests: true,
              expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // page media: posters, shots, team, brand, social, testimonials.
            // SWR (not CacheFirst) so replaced images refresh on revisit.
            urlPattern: /\/(videos|shots|social|team|testimonials|brand)\/.*\.(jpg|jpeg|png|webp)(\?.*)?$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'media',
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // testimonial preview clips
            urlPattern: /\/testimonials\/.*\.mp4$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'testimonial-videos',
              rangeRequests: true,
              expiration: { maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
