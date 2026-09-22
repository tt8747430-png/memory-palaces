import { type ReactNode, useLayoutEffect } from 'react'
import { statusBarColor } from '@/shared/lib'
import type { Theme } from '@/entities/preferences'
import { THEME_MIRROR_KEY } from './boot-paint'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/**
 * The attribute first: `--status-bar` answers per scheme, so the colour handed to the platform is
 * read after the document is wearing the theme it belongs to. A platform that ignores the meta
 * samples the page instead, which is why `body` is painted the same colour — see `tokens.css`.
 */
function paint(resolved: 'light' | 'dark') {
  document.documentElement.dataset.theme = resolved
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  const color = statusBarColor()
  // Empty only before the stylesheet lands, and `index.html` has already painted the bar by then.
  if (meta && color) meta.content = color
}

/**
 * Mirrors the choice, never the answer: "system" under a dark OS is not "dark". A mirror holding the
 * resolved scheme cannot tell the two apart, so the next launch painted from an OS setting that may
 * have changed in between — the very flash the mirror is there to prevent.
 */
function mirror(theme: Theme) {
  try {
    localStorage.setItem(THEME_MIRROR_KEY, theme)
  } catch {}
}

export function ThemeProvider({
  theme = 'system',
  children,
}: {
  theme?: Theme
  children: ReactNode
}) {
  useLayoutEffect(() => {
    paint(resolve(theme))
    mirror(theme)
    if (theme !== 'system') return

    const media = window.matchMedia(DARK_QUERY)
    const onChange = () => paint(media.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  return children
}
