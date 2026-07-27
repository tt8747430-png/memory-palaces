import { type FocusEvent, useCallback, useEffect, useRef } from 'react'

export function useAutoSelect<T extends HTMLInputElement | HTMLTextAreaElement>(active: boolean) {
  const done = useRef(false)

  useEffect(() => {
    if (!active) done.current = false
  }, [active])

  return useCallback(
    (event: FocusEvent<T>) => {
      if (!active || done.current) return
      done.current = true
      event.currentTarget.select()
    },
    [active],
  )
}
