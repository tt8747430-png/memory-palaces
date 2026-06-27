/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// vite-plugin-pwa here owns only the service worker. The web app manifest is hand-authored
// (public/manifest.webmanifest, linked in index.html), and the iOS launch screen is built at
// runtime by pwacompat from that manifest (src/main.tsx).
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' (not 'autoUpdate') so a waiting service worker surfaces an in-app
      // "update available" prompt the user taps, instead of silently applying on some
      // later cold start (PWAs rarely reload, so autoUpdate can lag for days).
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      // Manifest is hand-authored at public/manifest.webmanifest and linked in index.html;
      // `false` stops the plugin generating/injecting its own so there's a single source.
      manifest: false,
      workbox: {
        // webmanifest is included so the hand-authored manifest is precached for offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
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
