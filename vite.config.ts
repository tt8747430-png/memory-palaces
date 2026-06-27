/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import {
  iosSplashDevices,
  ORIENTATIONS,
  splashHref,
  splashMedia,
} from './scripts/ios-splash-devices.mjs'

// Inject the per-device <link rel="apple-touch-startup-image"> tags from the same device
// list that generates the images (scripts/generate-ios-splash.mjs), so the tags and the
// PNGs stay in lockstep and index.html stays free of a wall of <link>s.
function iosSplashLinks(): Plugin {
  return {
    name: 'ios-splash-links',
    transformIndexHtml: () =>
      iosSplashDevices.flatMap((device) =>
        ORIENTATIONS.map((orientation) => ({
          tag: 'link',
          attrs: {
            rel: 'apple-touch-startup-image',
            media: splashMedia(device, orientation),
            href: splashHref(device, orientation),
          },
          injectTo: 'head' as const,
        })),
      ),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    iosSplashLinks(),
    VitePWA({
      // 'prompt' (not 'autoUpdate') so a waiting service worker surfaces an in-app
      // "update available" prompt the user taps, instead of silently applying on some
      // later cold start (PWAs rarely reload, so autoUpdate can lag for days).
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mindscape — Your Memory Palace',
        short_name: 'Mindscape',
        description: 'Train your memory with the method of loci. Offline-first.',
        lang: 'en',
        // Navy: matches the index.html theme-color and the navy safe-area band painted
        // under the status bar, so the launch screen and Android shell stay on-brand.
        theme_color: '#091A7A',
        background_color: '#ADC8FF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // iOS caches the launch images itself when the app is added to the Home Screen, so
        // keep them out of the runtime precache (they'd add ~1.2 MB for no benefit).
        globIgnores: ['**/splash/**'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      // Keep the service worker out of `vite dev` so it can't cache-trap HMR.
      // Installability is verified against `vite build` + `vite preview`.
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/shared/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
