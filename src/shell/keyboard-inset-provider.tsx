import { type ReactNode, useEffect } from 'react'

/**
 * Publishes `--kb-inset`: the pixels of viewport the on-screen keyboard overlaps. AppScreen
 * consumes it as bottom scroll-padding (ADR-0010 amendment) so every page gains exactly
 * keyboard-height of scroll room while typing — controls under the keyboard are reached by
 * scrolling, never by lifting.
 */
export function KeyboardInsetProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const root = document.documentElement
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      root.style.setProperty('--kb-inset', `${inset}px`)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      root.style.removeProperty('--kb-inset')
    }
  }, [])
  return children
}
