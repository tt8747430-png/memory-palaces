import { useEffect } from 'react'

/**
 * Keeps `--kb` in sync with the on-screen keyboard and pins the app against iOS.
 *
 * iOS Safari does not support `interactive-widget`, treats `position: fixed` as static once
 * the keyboard is up, and scrolls the page to bring the focused field into view — which drags
 * the whole fixed app shell (header included) off the top. There is no keyboard event and no
 * layout resize; only the visual viewport changes.
 *
 * So on every visual-viewport change we do two things:
 *
 * 1. Publish the keyboard's overlap into the layout viewport as `--kb`, for the pieces that
 *    must clear the keyboard (a bottom sheet). The overlap is
 *    `innerHeight - visualViewport.height - offsetTop`.
 * 2. Snap the document scroll back to 0, holding the app still. Only the document is pinned;
 *    the app's own scrollers (`<main>`, a sheet body) are separate elements and keep working,
 *    so a field lower in a form is still reachable by scrolling its panel.
 *
 * Mount once, high in the tree.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const root = document.documentElement
    const pinScroll = () => {
      if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0)
      const scroller = document.scrollingElement
      if (scroller && scroller.scrollTop !== 0) scroller.scrollTop = 0
    }
    const update = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      root.style.setProperty('--kb', `${Math.round(overlap)}px`)
      pinScroll()
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    window.addEventListener('scroll', pinScroll, { passive: true })
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      window.removeEventListener('scroll', pinScroll)
      root.style.removeProperty('--kb')
    }
  }, [])
}
