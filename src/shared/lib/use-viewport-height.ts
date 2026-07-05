import { useEffect, useState } from 'react'

/**
 * The height of the *visual* viewport in px — the area actually visible to the user, which
 * the on-screen keyboard shrinks. The app shell is `position: fixed; inset: 0`, so it stays
 * full-height when the keyboard opens and iOS shoves focused inputs (and the chrome around
 * them) off-screen. A screen that owns an inline text field can size its own container to this
 * value instead, so its layout compresses to sit above the keyboard rather than under it.
 *
 * Returns `undefined` where there is no `visualViewport` (SSR / jsdom); callers fall back to
 * their CSS height in that case.
 */
export function useViewportHeight(): number | undefined {
  const [height, setHeight] = useState<number | undefined>(() =>
    typeof window !== 'undefined' && window.visualViewport
      ? window.visualViewport.height
      : undefined,
  )

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setHeight(vv.height)
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return height
}
