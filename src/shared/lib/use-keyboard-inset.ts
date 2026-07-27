import { useEffect } from 'react'

/**
 * Publishes the visible viewport as CSS variables on the document root so the app can sit exactly
 * where the learner can see it while the on-screen keyboard is up:
 *
 * - `--vv-top` — how far the visual viewport has slid down the layout viewport. iOS scrolls a
 *   focused field into view by moving the *visual* viewport, not the document; `position: fixed`
 *   boxes stay glued to the layout viewport and so ride up off the top of the screen by exactly
 *   this much. `#root` cancels it with `top: var(--vv-top)`.
 * - `--vvh` — the visual viewport height. `#root` takes this as its height, shrinking to the space
 *   above the keyboard (like native `resizes-content`): headers stay pinned, scroll areas shrink,
 *   their lower rows scroll up clear of the keyboard, and nothing is left as excess. The visual
 *   viewport already excludes the keyboard *and* its native accessory bar, so no guesswork.
 * - `--kb-inset` — the height the keyboard+bar occupy, for elements anchored to the layout
 *   viewport that must clear it (the study feedback panel, card scroll-padding).
 *
 * The two must be applied together: sizing to `--vvh` without offsetting by `--vv-top` puts the
 * app's bottom edge `--vv-top` px above the keyboard (a band of bare background) and clips the
 * same amount off its top (the sticky header vanishes). The document itself never scrolls
 * (`html`/`body` are `overflow: hidden`), so `offsetTop` is the whole story. Mount once, high in
 * the tree.
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
      const top = Math.max(0, vv.offsetTop)
      const inset = Math.max(0, root.clientHeight - visible - top)
      root.style.setProperty('--vv-top', `${Math.round(top)}px`)
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
      root.style.removeProperty('--vv-top')
      root.style.removeProperty('--vvh')
      root.style.removeProperty('--kb-inset')
    }
  }, [])
}
