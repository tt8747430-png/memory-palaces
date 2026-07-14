import { Injectable } from '@angular/core'

/**
 * Pins the app against iOS's keyboard scroll.
 *
 * iOS Safari does not support `interactive-widget`, treats `position: fixed` as
 * static once the keyboard is up, and scrolls the page to bring the focused
 * field into view — dragging the whole fixed app shell off the top. There is no
 * keyboard event and no layout resize; only the visual viewport changes. So on
 * every visual-viewport change we snap the document scroll back to 0, holding
 * the app still. The app's own scrollers (<main>, sheet bodies) are separate
 * elements and keep working.
 */
@Injectable({ providedIn: 'root' })
export class KeyboardPin {
  private started = false

  init(): void {
    if (this.started) return
    this.started = true
    const vv = window.visualViewport
    if (!vv) return

    const pin = (): void => {
      if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0)
      const scroller = document.scrollingElement
      if (scroller && scroller.scrollTop !== 0) scroller.scrollTop = 0
    }

    pin()
    vv.addEventListener('resize', pin)
    vv.addEventListener('scroll', pin)
    window.addEventListener('scroll', pin, { passive: true })
  }
}
