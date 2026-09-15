import { type ReactNode, useLayoutEffect } from 'react'
import type { Theme } from '@/entities/preferences'

const DARK_QUERY = '(prefers-color-scheme: dark)'

const THEME_MIRROR_KEY = 'mindscape:theme'

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function apply(resolved: 'light' | 'dark') {
  document.documentElement.dataset.theme = resolved
  try {
    localStorage.setItem(THEME_MIRROR_KEY, resolved)
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
    apply(resolve(theme))
    if (theme !== 'system') return

    const media = window.matchMedia(DARK_QUERY)
    const onChange = () => apply(media.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  return children
}
