import { useState } from 'react'
import { reconcileHeldOrder } from './reconcile-order'

export interface HeldOrder<T extends string> {
  /** The order to draw: what the drop asked for, until the store says the same. */
  order: readonly T[]
  /** Hand it the order a drop produced. Held on screen until the incoming ids agree. */
  hold: (next: readonly T[]) => void
}

/**
 * Keeps a dropped order on screen until the store catches up — CODE_STYLE §10, the first cause of
 * drop flicker. A reorder is one write per row, so the store re-emits half-applied states and the
 * rows snap back under the finger.
 *
 * Derived during render rather than mirrored into state by an effect: an effect draws one frame
 * from the stale copy first, which is the flicker it was meant to prevent. Once the incoming ids
 * already say what was asked for, the hold is released, so a change from anywhere else — another
 * device's Sync, a reset — comes straight through.
 */
export function useHeldOrder<T extends string>(ids: readonly T[]): HeldOrder<T> {
  const [pending, setPending] = useState<readonly T[] | null>(null)
  if (pending === null) return { order: ids, hold: setPending }

  const { order, settled } = reconcileHeldOrder(pending, ids)
  if (settled) {
    // Adjusting state during render: React re-runs this component immediately, so no frame is
    // drawn from the held copy after it has stopped being true.
    setPending(null)
    return { order: ids, hold: setPending }
  }
  return { order: order as T[], hold: setPending }
}
