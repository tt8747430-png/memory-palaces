import { fileURLToPath, URL } from 'node:url'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { STATUS_BAR } from './src/shared/config/status-bar'

/**
 * The status bar's colour for each OS scheme, ahead of `index.html`'s boot script, which repaints
 * both for the learner's theme before first paint; `ThemeProvider` keeps them after (ADR 0007).
 * The HTML iOS parses is then right for the OS's theme before any script has run.
 */
function statusBarMeta(): Plugin {
  return {
    name: 'status-bar-meta',
    transformIndexHtml: () =>
      (['light', 'dark'] as const).map((scheme) => ({
        tag: 'meta',
        attrs: {
          name: 'theme-color',
          media: `(prefers-color-scheme: ${scheme})`,
          content: STATUS_BAR[scheme],
        },
        injectTo: 'head-prepend' as const,
      })),
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
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
  },
}))
