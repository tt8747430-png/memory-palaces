import { useEffect, useState } from 'react'

export interface VisualViewportBox {
  /** Height of the visible area in px — what the on-screen keyboard leaves free. */
  height: number
  /** How far the visual viewport has been panned down the layout viewport. iOS pans the
   *  page (instead of resizing it) to keep a focused field visible; a fixed shell must
   *  translate by this offset or its bottom chrome floats away from the keyboard. */
  offsetTop: number
}

/**
 * The *visual* viewport box — the area actually visible to the user, which the on-screen
 * keyboard shrinks and iOS pans. The app shell is `position: fixed; inset: 0`, so it stays
 * full-height when the keyboard opens and iOS shoves focused inputs (and the chrome around
 * them) off-screen. A screen that owns an inline text field sizes its own container to
 * `height` and translates it by `offsetTop`, so its layout compresses to sit above the
 * keyboard and follows the pan instead of sliding under it.
 *
 * Returns `undefined` where there is no `visualViewport` (SSR / jsdom); callers fall back to
 * their CSS height in that case.
 */
export function useVisualViewport(): VisualViewportBox | undefined {
  const [box, setBox] = useState<VisualViewportBox | undefined>(() =>
    typeof window !== 'undefined' && window.visualViewport
      ? { height: window.visualViewport.height, offsetTop: window.visualViewport.offsetTop }
      : undefined,
  )

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    let frame = 0
    // Coalesce the resize/scroll bursts a keyboard animation fires into one paint.
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() =>
        setBox({ height: vv.height, offsetTop: vv.offsetTop }),
      )
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      cancelAnimationFrame(frame)
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return box
}
