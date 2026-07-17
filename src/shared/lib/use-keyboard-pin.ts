import { useEffect } from 'react'

/**
 * Pins the app against iOS's keyboard scroll.
 *
 * iOS Safari does not support `interactive-widget`, treats `position: fixed` as static once
 * the keyboard is up, and scrolls the page to bring the focused field into view — which drags
 * the whole fixed app shell (header included) off the top. There is no keyboard event and no
 * layout resize; only the visual viewport changes. So on every visual-viewport change we snap
 * the document scroll back to 0, holding the app still. The app's own scrollers (`<main>`, a
 * sheet body) are separate elements and keep working.
 *
 * Bottom sheets lift themselves over the keyboard via the Base UI Drawer's
 * `VirtualKeyboardProvider`; this hook is what keeps full-page surfaces (editors, forms) from
 * sliding. Mount once, high in the tree.
 */
export function useKeyboardPin() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const pin = () => {
      if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0)
      const scroller = document.scrollingElement
      if (scroller && scroller.scrollTop !== 0) scroller.scrollTop = 0
    }

    pin()
    vv.addEventListener('resize', pin)
    vv.addEventListener('scroll', pin)
    window.addEventListener('scroll', pin, { passive: true })
    return () => {
      vv.removeEventListener('resize', pin)
      vv.removeEventListener('scroll', pin)
      window.removeEventListener('scroll', pin)
    }
  }, [])
}
