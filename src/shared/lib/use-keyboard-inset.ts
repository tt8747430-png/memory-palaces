import { useEffect } from 'react'

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
