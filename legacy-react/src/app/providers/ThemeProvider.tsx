import { type ReactNode, useEffect } from 'react'
import type { Theme } from '@/entities/preferences'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

export function ThemeProvider({
  theme = 'system',
  children,
}: {
  theme?: Theme
  children: ReactNode
}) {
  useEffect(() => {
    document.documentElement.dataset.theme = resolve(theme)
    if (theme !== 'system') return

    const media = window.matchMedia(DARK_QUERY)
    const onChange = () => {
      document.documentElement.dataset.theme = media.matches ? 'dark' : 'light'
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  return children
}
