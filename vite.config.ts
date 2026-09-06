import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const escapeForRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Queue Supabase writes that were made while offline (or during the last moments of a closing tab)
 * and replay them once the browser is back. RxDB's own retry covers a live session; this covers the
 * case where the tab dies first. Absent a configured project, there is nothing to queue.
 */
function supabasePushQueue(supabaseUrl: string | undefined) {
  if (!supabaseUrl) return []
  const rest = new RegExp(`^${escapeForRegExp(new URL(supabaseUrl).origin)}/rest/`)
  const backgroundSync = {
    name: 'supabase-push-queue',
    options: { maxRetentionTime: 24 * 60 },
  }
  return (['POST', 'PATCH'] as const).map((method) => ({
    urlPattern: rest,
    handler: 'NetworkOnly' as const,
    method,
    options: { backgroundSync },
  }))
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mindscape — Your Memory Palace',
        short_name: 'Mindscape',
        description: 'Train your memory with the method of loci. Offline-first.',
        lang: 'en',
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
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: supabasePushQueue(loadEnv(mode, process.cwd(), 'VITE_').VITE_SUPABASE_URL),
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * The three dependencies that dwarf everything else get their own chunks.
         *
         * Not to shrink the first load — the app cannot paint without its database, so these are
         * fetched either way. It is so a deploy that touches app code does not invalidate them:
         * the service worker precaches by file, and RxDB and Dexie together are ~300 kB that has
         * not changed since the last release. Grouped by name rather than by importer so the
         * boundary survives a refactor.
         */
        advancedChunks: {
          groups: [
            { name: 'persistence', test: /node_modules\/(rxdb|dexie)\// },
            { name: 'supabase', test: /node_modules\/@supabase\// },
            { name: 'react', test: /node_modules\/(react|react-dom|scheduler)\// },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/shared/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // A developer's .env.local must not change what the unit suite tests. The offline path is the
    // one under test; the integration suites opt in through their own SUPABASE_TEST_* variables.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
  },
}))
