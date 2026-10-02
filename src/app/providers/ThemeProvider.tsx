import { type ReactNode, useLayoutEffect } from 'react'
import { type ColorScheme, paintStatusBar } from '@/shared/lib'
import type { Theme } from '@/entities/preferences'
import { THEME_MIRROR_KEY } from './boot-paint'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function resolve(theme: Theme): ColorScheme {
  if (theme !== 'system') return theme
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/** The document and the status bar together: iOS and Android paint the bar from `theme-color`. */
function paint(scheme: ColorScheme) {
  document.documentElement.dataset.theme = scheme
  paintStatusBar(scheme)
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

/**
 * Keeps `data-theme` and the status bar on the learner's theme; on "system" it follows the OS.
 * `theme` is `undefined` until the stored choice is known, and nothing is painted or mirrored then:
 * `index.html`'s boot script already painted that choice, and a default painted in its place is
 * the colour iOS would be handed while the app loads (ADR 0007).
 */
export function ThemeProvider({
  theme,
  children,
}: {
  theme: Theme | undefined
  children: ReactNode
}) {
  useLayoutEffect(() => {
    if (theme === undefined) return
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
