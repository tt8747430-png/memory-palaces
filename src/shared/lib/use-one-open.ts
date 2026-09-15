import { useCallback, useMemo, useRef, useState } from 'react'

export interface OneOpen<T> {
  current: T | null
  open: (which: T) => void
  close: (which?: T) => void
  take: () => T | null
  onOpenChange: (which: T) => (open: boolean) => void
}

export function useOneOpen<T>(): OneOpen<T> {
  const [current, setCurrent] = useState<T | null>(null)
  const held = useRef<T | null>(null)

  const open = useCallback((which: T) => {
    held.current = which
    setCurrent(which)
  }, [])

  const close = useCallback((which?: T) => {
    if (which !== undefined && held.current !== which) return
    held.current = null
    setCurrent(null)
  }, [])

  const take = useCallback(() => {
    const which = held.current
    held.current = null
    setCurrent(null)
    return which
  }, [])

  const onOpenChange = useCallback(
    (which: T) => (next: boolean) => {
      if (!next) close(which)
    },
    [close],
  )

  return useMemo(
    () => ({ current, open, close, take, onOpenChange }),
    [current, open, close, take, onOpenChange],
  )
}
