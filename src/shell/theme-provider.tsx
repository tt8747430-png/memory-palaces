import { type ReactNode, useEffect } from 'react'
import type { Theme } from '@/settings'
import { useServices } from '@/shell/services-provider'
import { useStore } from '@/shared/data/use-store'

const DARK_QUERY = '(prefers-color-scheme: dark)'

// The app's status-bar/nav-bar color, both light and dark — sourced from index.html's three
// theme-color metas and the webmanifest's theme_color. Same navy for both schemes: the app
// theme wins regardless of the OS scheme (see syncThemeColor below). Documented raw-hex
// exception (CLAUDE.md).
const THEME_COLOR = { light: '#091A7A', dark: '#091A7A' } as const

// null = the bare (no-media) meta. iOS standalone paints its status bar from the bare tag only
// (media-attributed ones are ignored there — verified on device); dark-mode Chromium ignores a
// lone bare tag, hence the attributed pair. Bare stays first so tree order favors it.
const THEME_COLOR_MEDIA = [null, '(prefers-color-scheme: light)', DARK_QUERY] as const

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/**
 * iOS Safari ignores in-place `content` mutation on a `<meta name="theme-color">` node — the
 * status bar only repaints if the node is removed and a fresh one appended. All three metas
 * (bare + both media-attributed, see THEME_COLOR_MEDIA) get the same app-resolved color so the
 * app's theme wins over the OS scheme everywhere: the bare tag drives the iOS standalone status
 * bar, the attributed pair drives dark-mode Chromium.
 */
function syncThemeColor(resolved: 'light' | 'dark') {
  const color = THEME_COLOR[resolved]
  for (const media of THEME_COLOR_MEDIA) {
    const selector = media
      ? `meta[name="theme-color"][media="${media}"]`
      : 'meta[name="theme-color"]:not([media])'
    document.head.querySelector(selector)?.remove()
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    if (media) meta.media = media
    meta.content = color
    document.head.appendChild(meta)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useStore(useServices().preferencesStore.effective).theme

  useEffect(() => {
    const apply = () => {
      const resolved = resolve(theme)
      document.documentElement.dataset['theme'] = resolved
      syncThemeColor(resolved)
    }
    apply()
    if (theme !== 'system') return

    const media = window.matchMedia(DARK_QUERY)
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  return children
}
