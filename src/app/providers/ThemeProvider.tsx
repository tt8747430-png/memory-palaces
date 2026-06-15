import { type ReactNode, useEffect } from 'react'

export type Theme = 'light' | 'dark' | 'system'

/**
 * Sets `[data-theme]` on <html>; the semantic token layer re-maps off it. Light
 * only for now — the dark map lands in Phase 12 with no component edits.
 */
export function ThemeProvider({
  theme = 'light',
  children,
}: {
  theme?: Theme
  children: ReactNode
}) {
  useEffect(() => {
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme
    document.documentElement.dataset.theme = resolved
  }, [theme])

  return children
}
