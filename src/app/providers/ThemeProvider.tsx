import { type ReactNode, useLayoutEffect } from 'react'
import type { Theme } from '@/entities/preferences'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * Where the boot script in `index.html` reads the theme from. The preference itself lives in RxDB,
 * which no script can read before first paint, so the *resolved* theme is mirrored here on every
 * change and the mirror is what paints. Nothing else may read this key — it is a paint hint, not
 * the preference.
 */
const THEME_MIRROR_KEY = 'mindscape:theme'

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function apply(resolved: 'light' | 'dark') {
  document.documentElement.dataset.theme = resolved
  try {
    localStorage.setItem(THEME_MIRROR_KEY, resolved)
  } catch {
    // Private mode, or storage denied. The app still themes; only the next boot flashes.
  }
}

export function ThemeProvider({
  theme = 'system',
  children,
}: {
  theme?: Theme
  children: ReactNode
}) {
  // Layout, not passive: the boot script has already painted a theme, and a frame spent in the
  // other one after the preference loads reads as a flash just as much as the one it replaced.
  useLayoutEffect(() => {
    apply(resolve(theme))
    if (theme !== 'system') return

    const media = window.matchMedia(DARK_QUERY)
    const onChange = () => apply(media.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  return children
}
