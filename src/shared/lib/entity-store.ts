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

export function createCollectionStore<Key extends string, T extends Identifiable>(
  key: Key,
  repo: Repository<T>,
  compare: (a: T, b: T) => number,
): StoreApi<CollectionState<Key, T>> {
  type State = CollectionState<Key, T>
  let unsubscribe: Unsubscribe | null = null

  // The caller picks the state key, so a computed-key literal widens to an index
  // signature here. The cast is confined to these helpers; `State` stays exact.
  const loaded = (entities: T[]) =>
    ({ [key]: entities, status: 'ready' }) as unknown as Partial<State>
  const idle = { [key]: [] as T[], status: 'idle' } as unknown as State
  const loading = { status: 'loading' } as Partial<State>

  return createStore<State>((set) => ({
    ...idle,

    start() {
      if (unsubscribe) return
      set(loading)
      unsubscribe = repo.observe((entities) => {
        set(loaded([...entities].sort(compare)))
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save: (entity: T) => repo.save(entity),

    async remove(id: string) {
      await repo.remove(id)
    },
  }))
}

export function createSingletonStore<Key extends string, T extends Identifiable>(
  key: Key,
  repo: Repository<T>,
): StoreApi<SingletonState<Key, T>> {
  type State = SingletonState<Key, T>
  let unsubscribe: Unsubscribe | null = null

  const loaded = (entity: T | null) =>
    ({ [key]: entity, status: 'ready' }) as unknown as Partial<State>
  const idle = { [key]: null, status: 'idle' } as unknown as State
  const loading = { status: 'loading' } as Partial<State>

  return createStore<State>((set) => ({
    ...idle,

    start() {
      if (unsubscribe) return
      set(loading)
      unsubscribe = repo.observe((entities) => {
        set(loaded(entities[0] ?? null))
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save: (entity: T) => repo.save(entity),
  }))
}
