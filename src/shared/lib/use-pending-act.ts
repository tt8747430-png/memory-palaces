import { useCallback, useMemo } from 'react'
import { useOneOpen } from './use-one-open'

export interface PendingAct<T> {
  /** The act awaiting an answer, or `null` when no dialog is up. */
  act: T | null
  request: (act: T) => void
  /** Drops `act`, or — called bare — whatever is pending. Guarded by identity, like a sheet's. */
  dismiss: (act?: T) => void
  /** `onOpenChange` for one dialog: it may only dismiss the act it belongs to. */
  onOpenChange: (act: T) => (open: boolean) => void
  /**
   * Clears the pending act and hands it to `run`. Taken before the clear and handed over exactly
   * once, so a double-tapped confirm — both taps landing before React re-renders — cannot run the
   * command twice.
   */
  resolve: (run: (act: T) => void) => void
}

/**
 * The one act a screen is waiting on the user to confirm — a delete, a move, an import. Screens
 * take one of these instead of hand-rolling request/dismiss/confirm, so "confirming runs it once
 * and closes" means the same thing everywhere. One `pending` value, never a boolean per dialog:
 * separate flags make "delete over the move sheet" reachable.
 *
 * `useOneOpen` holds the value and the identity-guarded close; this adds the one thing a
 * confirmation needs beyond a sheet — handing the act over exactly once.
 */
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
