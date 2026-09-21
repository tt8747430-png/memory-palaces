import { useSyncExternalStore } from 'react'

export type ColorScheme = 'light' | 'dark'

/**
 * The scheme the app is painted in, read off `data-theme` — the one the inline script in
 * `index.html` sets before first paint and `ThemeProvider` keeps. Reading the document rather
 * than a provider keeps one source of truth, and works in a preview or a test with no app around
 * it.
 */
export function readColorScheme(): ColorScheme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

/** One observer for the whole app, however many components are watching. */
const listeners = new Set<() => void>()
let observer: MutationObserver | null = null

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange)
  if (!observer && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => {
      for (const listener of listeners) listener()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
  }
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0) {
      observer?.disconnect()
      observer = null
    }
  }
}

export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, readColorScheme, () => 'light')
}
