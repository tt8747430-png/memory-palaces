import { fileURLToPath, URL } from 'node:url'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { STATUS_BAR, THEME_COLOR_METAS } from './src/shared/config/status-bar.ts'
import { brandLaunch } from './scripts/brand/vite-plugin.ts'

/**
 * The status bar's colour for each OS scheme, ahead of `index.html`'s boot script, which repaints
 * both for the learner's theme before first paint; `useDeviceTheme` keeps them after (ADR 0007).
 * `head-prepend` is what puts them ahead of the script.
 */
function statusBarMeta(): Plugin {
  return {
    name: 'status-bar-meta',
    transformIndexHtml: () =>
      THEME_COLOR_METAS.map((attrs) => ({ tag: 'meta', attrs, injectTo: 'head-prepend' as const })),
  }
}

const escapeForRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function supabasePushQueue(supabaseUrl: string | undefined) {
  if (!supabaseUrl) return []
  const rest = new RegExp(`^${escapeForRegExp(new URL(supabaseUrl).origin)}/rest/`)
  return (['POST', 'PATCH'] as const).map((method) => ({
    urlPattern: rest,
    handler: 'NetworkOnly' as const,
    method,
    options: {
      backgroundSync: {
        name: `supabase-push-queue-${method.toLowerCase()}`,
        options: { maxRetentionTime: 24 * 60 },
      },
    },
  }))
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    statusBarMeta(),
    brandLaunch(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mindscape — Your Memory Palace',
        short_name: 'Mindscape',
        description: 'Train your memory with the method of loci. Offline-first.',
        lang: 'en',
        // Android's launch bar, before the page's own metas take over: the bar is the chrome colour
        // from launch on (ADR 0007). A manifest names one colour, so it is the light scheme's.
        theme_color: STATUS_BAR.light,
        // Android's launch screen: the icon on this colour, then the page paints the same frame.
        background_color: STATUS_BAR.light,
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
        // One device ever reads one of these, and iOS fetches it itself.
        globIgnores: ['splash/**'],
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
    rolldownOptions: {
      output: {
        codeSplitting: {
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
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'scripts/**/*.test.ts'],
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
  },
}))
