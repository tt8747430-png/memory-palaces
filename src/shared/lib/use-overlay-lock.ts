import { useEffect } from 'react'

// Ref-counted so nested sheets each hold the lock; the marker clears only once
// the last one closes.
let openCount = 0

/**
 * Marks the document with `data-overlay` while a sheet (or other keyboard-bearing
 * overlay) is open. Full-page shells (`.kb-fit`) read it to stop shrinking for the
 * keyboard while an overlay is up — the sheet lifts itself instead, so the page
 * behind its translucent backdrop stays put.
 */
export function useOverlayLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    openCount += 1
    document.documentElement.setAttribute('data-overlay', '')
    return () => {
      openCount = Math.max(0, openCount - 1)
      if (openCount === 0) document.documentElement.removeAttribute('data-overlay')
    }
  }, [active])
}
