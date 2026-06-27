import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { LocusRepository } from '@/entities/locus'
import type { Locus } from './types'

export type LocusStatus = 'idle' | 'loading' | 'ready'

export interface LocusState {
  loci: Locus[]
  status: LocusStatus
  /** Subscribe to the repository's reactive stream (idempotent); keeps `loci` live. */
  start: () => void
  /** End the reactive subscription. */
  stop: () => void
  save: (locus: Locus) => Promise<Locus>
  remove: (id: string) => Promise<void>
}

export type LocusStore = StoreApi<LocusState>

// Cards read in their explicit `order`; equal orders (legacy/migrated data) tiebreak by
// creation time so they keep their original sequence until reordered.
const byOrder = (a: Locus, b: Locus): number =>
  a.order - b.order || a.createdAt.localeCompare(b.createdAt)

/** Store FACTORY (repository INJECTED), reactive like the palace/room stores. */
export function createLocusStore(repo: LocusRepository): LocusStore {
  let unsubscribe: Unsubscribe | null = null
  return createStore<LocusState>((set) => ({
    loci: [],
    status: 'idle',

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((loci) => {
        set({ loci: [...loci].sort(byOrder), status: 'ready' })
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save(locus) {
      return repo.save(locus)
    },

    async remove(id) {
      await repo.remove(id)
    },
  }))
}
