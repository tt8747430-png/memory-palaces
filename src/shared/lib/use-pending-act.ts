import { useCallback, useMemo } from 'react'
import { useOneOpen } from './use-one-open'

export interface PendingAct<T> {
  act: T | null
  request: (act: T) => void
  dismiss: (act?: T) => void
  onOpenChange: (act: T) => (open: boolean) => void
  resolve: (run: (act: T) => void) => void
}

export function usePendingAct<T>(): PendingAct<T> {
  const { current, open, close, take, onOpenChange } = useOneOpen<T>()

  const resolve = useCallback(
    (run: (pending: T) => void) => {
      const pending = take()
      if (pending !== null) run(pending)
    },
    [take],
  )

  return useMemo(
    () => ({ act: current, request: open, dismiss: close, onOpenChange, resolve }),
    [current, open, close, onOpenChange, resolve],
  )
}
