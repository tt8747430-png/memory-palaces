import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Identifiable, Repository, Unsubscribe } from '@/shared/api'

export type StoreStatus = 'idle' | 'loading' | 'ready'

interface Lifecycle {
  status: StoreStatus
  start: () => void
  stop: () => void
}

/** A store that mirrors every row of a repository under `Key`. */
export type CollectionState<Key extends string, T> = Lifecycle &
  Record<Key, T[]> & {
    save: (entity: T) => Promise<T>
    remove: (id: string) => Promise<void>
  }

/** A store that mirrors the single row of a repository under `Key`. */
export type SingletonState<Key extends string, T> = Lifecycle &
  Record<Key, T | null> & {
    save: (entity: T) => Promise<T>
  }

/** True once a store has received its first snapshot from the repository. */
export const selectIsReady = (state: Pick<Lifecycle, 'status'>): boolean => state.status === 'ready'

type SetPartial = (partial: object) => void

/**
 * The half of a store every slice shares: hold `key` at `empty` until `start()`, then keep it equal
 * to whatever `project` makes of the repository's latest snapshot; `save` passes straight through.
 *
 * Written once so subscribe/teardown cannot drift between store shapes. The caller picks the state
 * key, so the literals here widen to an index signature and each factory casts back to its exact
 * state.
 */
function mirrorSlice<T extends Identifiable, Held>(
  key: string,
  repo: Repository<T>,
  empty: Held,
  project: (entities: readonly T[]) => Held,
) {
  let unsubscribe: Unsubscribe | null = null

  return (set: SetPartial) => ({
    [key]: empty,
    status: 'idle' as StoreStatus,

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((entities) => set({ [key]: project(entities), status: 'ready' }))
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save: (entity: T) => repo.save(entity),
  })
}

export function createCollectionStore<Key extends string, T extends Identifiable>(
  key: Key,
  repo: Repository<T>,
  compare: (a: T, b: T) => number,
): StoreApi<CollectionState<Key, T>> {
  const mirror = mirrorSlice<T, T[]>(key, repo, [], (entities) => [...entities].sort(compare))
  return createStore<CollectionState<Key, T>>(
    (set) =>
      ({
        ...mirror(set as SetPartial),
        async remove(id: string) {
          await repo.remove(id)
        },
      }) as unknown as CollectionState<Key, T>,
  )
}

export function createSingletonStore<Key extends string, T extends Identifiable>(
  key: Key,
  repo: Repository<T>,
): StoreApi<SingletonState<Key, T>> {
  const mirror = mirrorSlice<T, T | null>(key, repo, null, (entities) => entities[0] ?? null)
  return createStore<SingletonState<Key, T>>(
    (set) => mirror(set as SetPartial) as unknown as SingletonState<Key, T>,
  )
}
