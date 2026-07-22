import { useEffect } from 'react'

/**
 * Publishes the visible viewport as CSS variables on the document root so shells can fit
 * themselves above the on-screen keyboard:
 *
 * - `--vvh` — the visual viewport height. Shells set their height to this, shrinking to the space
 *   above the keyboard (like native `resizes-content`): the header stays pinned, the scroll area
 *   shrinks, its lower rows scroll up clear of the keyboard, and nothing is left as excess. The
 *   visual viewport already excludes the keyboard *and* its native form accessory bar, so no
 *   guesswork about either.
 * - `--kb-inset` — the height the keyboard+bar occupy, for elements that must sit just above it
 *   (the study feedback panel, card scroll-padding).
 *
 * iOS keeps the layout viewport at full height when the keyboard opens (only the visual viewport
 * shrinks), which is why sizing to `--vvh` is what moves content; the document never scrolls, so
 * `offsetTop` stays ~0 and is kept only as a guard. Replaces the old scroll-pinning hook. Mount
 * once, high in the tree.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport
    const root = document.documentElement
    if (!vv) return

    let frame = 0
    const apply = () => {
      frame = 0
      const visible = vv.height
      const inset = Math.max(0, root.clientHeight - visible - vv.offsetTop)
      root.style.setProperty('--vvh', `${Math.round(visible)}px`)
      root.style.setProperty('--kb-inset', `${Math.round(inset)}px`)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(apply)
    }

    apply()
    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      root.style.removeProperty('--vvh')
      root.style.removeProperty('--kb-inset')
    }
  }, [])
}
