import { useEffect } from 'react'

/**
 * Keeps the `--kb` custom property in sync with the on-screen keyboard height.
 *
 * With `interactive-widget=resizes-visual`, the soft keyboard overlays the app
 * instead of shrinking the layout — so the app behind a sheet stays still. The
 * pieces that must clear the keyboard (a bottom sheet, an editor's action bar)
 * read `--kb` and offset by exactly the keyboard's overlap, so only they move.
 *
 * The overlap is the slice of the layout viewport left below the visual viewport
 * once the keyboard is up: `innerHeight - visualViewport.height - offsetTop`.
 * Mount once, high in the tree.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const root = document.documentElement
    const update = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      root.style.setProperty('--kb', `${Math.round(overlap)}px`)
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      root.style.removeProperty('--kb')
    }
  }, [])
}
