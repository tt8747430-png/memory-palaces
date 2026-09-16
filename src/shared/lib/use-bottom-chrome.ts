import { useCallback, useRef } from 'react'
import { claimBottomChrome } from './bottom-chrome'

export function useBottomChrome(): (node: Element | null) => void {
  const release = useRef<(() => void) | null>(null)

  return useCallback((node: Element | null) => {
    release.current?.()
    release.current = null
    if (!node) return
    release.current = claimBottomChrome(node)
  }, [])
}
