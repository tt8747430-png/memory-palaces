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
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/shared/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
}))
