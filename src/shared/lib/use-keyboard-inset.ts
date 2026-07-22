import { useEffect } from 'react'

/**
 * Publishes the on-screen keyboard's height as the `--kb-inset` CSS variable on the document
 * root. Scroll surfaces add matching bottom slack (`.pb-safe-kb`) so their lower content can be
 * scrolled up clear of the keyboard — a field or button pinned near the bottom stays reachable.
 *
 * iOS's `interactive-widget=resizes-visual` shrinks only the *visual* viewport; the fixed app
 * shell keeps its full layout height with its bottom edge hidden behind the keyboard. The gap
 * between the two viewports is the keyboard. This replaces the old scroll-pinning hook, which
 * froze the page against that scroll and left hidden fields unreachable (and broke the caret /
 * text-selection on autofocused inputs, because the page could never move to reveal them).
 *
 * Mount once, high in the tree.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport
    const root = document.documentElement
    if (!vv) return

    let frame = 0
    const apply = () => {
      frame = 0
      // The document itself never scrolls (fixed shell), so `offsetTop` stays ~0; it is kept in
      // the sum only as a guard for hosts that do offset the visual viewport.
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      root.style.setProperty('--kb-inset', `${Math.round(inset)}px`)
    }
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(apply)
    }

    apply()
    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      root.style.removeProperty('--kb-inset')
    }
  }, [])
}
