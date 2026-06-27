import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { PalaceRepository } from '@/entities/palace'
import type { Palace } from './types'

export type PalaceStatus = 'idle' | 'loading' | 'ready'

export interface PalaceState {
  palaces: Palace[]
  status: PalaceStatus
  /** Subscribe to the repository's reactive stream (idempotent); keeps `palaces` live. */
  start: () => void
  /** End the reactive subscription. */
  stop: () => void
  save: (palace: Palace) => Promise<Palace>
  remove: (id: string) => Promise<void>
}

export type PalaceStore = StoreApi<PalaceState>

const byNewestFirst = (a: Palace, b: Palace): number => b.createdAt.localeCompare(a.createdAt)

/**
 * Store FACTORY (repository INJECTED — Dependency Inversion). The list is
 * RxDB-reactive: `start()` subscribes to the repository stream, so saves, removes,
 * and (Phase 9) cross-device sync writes flow into `palaces` without a manual
 * reload. Mutations only persist through the port; the subscription updates state —
 * RxDB stays the single source of truth.
 */
export function createPalaceStore(repo: PalaceRepository): PalaceStore {
  let unsubscribe: Unsubscribe | null = null
  return createStore<PalaceState>((set) => ({
    palaces: [],
    status: 'idle',

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((palaces) => {
        set({ palaces: [...palaces].sort(byNewestFirst), status: 'ready' })
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save(palace) {
      return repo.save(palace)
    },

    async remove(id) {
      await repo.remove(id)
    },
  }))
}
