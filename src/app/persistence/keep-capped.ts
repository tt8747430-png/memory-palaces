import type { StoreApi } from 'zustand/vanilla'
import type { Identifiable } from '@/shared/api'
import { selectIsReady, type StoreStatus } from '@/shared/lib'

interface CappedState {
  status: StoreStatus
  remove: (id: string) => Promise<void>
}

/**
 * Holds a mirroring collection at its cap, oldest first out. A cap is a repair no one document
 * can decide — it has to see the others — so it lives here, not in the command that writes.
 *
 * Reads the store's own order, which every capped collection keeps newest-first, so the tail is the
 * oldest. Trims off a microtask and refuses to overlap itself: trimming writes, and a write is
 * another mirror, which would otherwise call this straight back. Once a trim lands it asks again,
 * because the mirrors that arrived while it ran were the ones it skipped.
 */
export function keepCapped<State extends CappedState>(
  store: StoreApi<State>,
  read: (state: State) => readonly Identifiable[],
  cap: number,
): () => void {
  let running = false
  let stopped = false

  const check = () => {
    const state = store.getState()
    if (stopped || running || !selectIsReady(state)) return
    const stale = read(state).slice(cap)
    if (stale.length === 0) return
    running = true
    queueMicrotask(() => {
      void Promise.all(stale.map((entity) => store.getState().remove(entity.id))).finally(() => {
        running = false
        check()
      })
    })
  }

  check()
  const unsubscribe = store.subscribe(check)
  return () => {
    stopped = true
    unsubscribe()
  }
}
