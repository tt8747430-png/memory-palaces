import { useEffect, useState } from 'react'

export interface VirtualKeyboard {
  open: boolean
  height: number
}

const KEYBOARD_MIN = 120

export function useVirtualKeyboard(): VirtualKeyboard {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    let frame = 0
    const apply = () => {
      frame = 0
      const gap = Math.max(0, document.documentElement.clientHeight - vv.height - vv.offsetTop)
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
