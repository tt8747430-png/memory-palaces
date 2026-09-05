import { useCallback, useMemo, useRef, useState } from 'react'

export interface OneOpen<T> {
  /** The open member, or `null` when none is. */
  current: T | null
  open: (which: T) => void
  /** Closes `which`, or — called bare — whatever is open. */
  close: (which?: T) => void
  /** Closes whatever is open and hands it back, `null` when nothing was. */
  take: () => T | null
  /** `onOpenChange` for one member: it may only close itself. */
  onOpenChange: (which: T) => (open: boolean) => void
}

/**
 * One open thing at a time — a sheet, a dialog, a confirmation. A flag per member makes "export
 * over move" a reachable state; one value cannot hold two.
 *
 * The guard that earns the hook: a member on its way out fires `onOpenChange(false)` *after* its
 * replacement has opened, so closing is by identity — `close(which)` is a no-op unless `which` is
 * the one that is open. The comparison reads a ref rather than the rendered value, because both
 * events can land in one frame, before React has re-rendered either.
 */
export function useOneOpen<T>(): OneOpen<T> {
  const [current, setCurrent] = useState<T | null>(null)
  // The authority on what is open. State lags a frame; two taps do not wait for it.
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
