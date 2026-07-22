import { useEffect, useState } from 'react'

export interface VirtualKeyboard {
  open: boolean
  height: number
}

// Below this the gap is browser chrome (home indicator, URL bar), not a keyboard.
const KEYBOARD_MIN = 120

/**
 * Reports the on-screen keyboard as React state — `{ open, height }` — from the visual viewport,
 * for surfaces that need to reposition a floating element above it (not just add scroll slack
 * like `useKeyboardInset`). `interactive-widget=resizes-visual` keeps the layout viewport at full
 * height, so the gap under the visual viewport is the keyboard.
 */
export function useVirtualKeyboard(): VirtualKeyboard {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    let frame = 0
    const apply = () => {
      frame = 0
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setHeight(gap >= KEYBOARD_MIN ? Math.round(gap) : 0)
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
    }
  }, [])

  return { open: height > 0, height }
}
