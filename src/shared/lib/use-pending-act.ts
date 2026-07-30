import { useCallback, useMemo, useRef, useState } from 'react'

export interface PendingAct<T> {
  /** The act awaiting an answer, or `null` when no dialog is up. */
  act: T | null
  request: (act: T) => void
  dismiss: () => void
  /**
   * Clears the pending act and hands it to `run`. The act is taken before the
   * clear and handed over exactly once, so a double-tapped confirm — both taps
   * landing before React re-renders — cannot run the command twice.
   */
  resolve: (run: (act: T) => void) => void
}

/**
 * Holds the one act a screen is waiting on the user to confirm — a delete, a
 * move, an import. Screens ask for one of these instead of hand-rolling the
 * request/dismiss/confirm trio, so "confirming runs it once and closes" means
 * the same thing on every screen.
 */
export function usePendingAct<T>(): PendingAct<T> {
  const [act, setAct] = useState<T | null>(null)
  const held = useRef<T | null>(null)

  const request = useCallback((next: T) => {
    held.current = next
    setAct(next)
  }, [])

  const dismiss = useCallback(() => {
    held.current = null
    setAct(null)
  }, [])

  const resolve = useCallback((run: (pending: T) => void) => {
    const current = held.current
    held.current = null
    setAct(null)
    if (current !== null) run(current)
  }, [])

  return useMemo(() => ({ act, request, dismiss, resolve }), [act, request, dismiss, resolve])
}
