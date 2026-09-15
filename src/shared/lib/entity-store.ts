import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Identifiable, Repository, Unsubscribe } from '@/shared/api'

export type StoreStatus = 'idle' | 'loading' | 'ready'

interface Lifecycle {
  status: StoreStatus
  start: () => void
  stop: () => void
}

export type CollectionState<Key extends string, T> = Lifecycle &
  Record<Key, T[]> & {
    save: (entity: T) => Promise<T>
    remove: (id: string) => Promise<void>
  }

export type SingletonState<Key extends string, T> = Lifecycle &
  Record<Key, T | null> & {
    save: (entity: T) => Promise<T>
  }

export const selectIsReady = (state: Pick<Lifecycle, 'status'>): boolean => state.status === 'ready'

type SetPartial = (partial: object) => void

export interface PendingChangePort {
  save: (entityId: string) => Promise<void>
  remove: (entityId: string) => Promise<void>
}

export interface CollectionStoreOptions<T> {
  pending?: PendingChangePort
  complete?: (entity: T) => T
}

function mirrorSlice<T extends Identifiable, Held>(
  key: string,
  repo: Repository<T>,
  empty: Held,
  project: (entities: readonly T[]) => Held,
  pending?: PendingChangePort,
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

    async save(entity: T) {
      const saved = await repo.save(entity)
      await pending?.save(entity.id)
      return saved
    },
  })
}

export function createCollectionStore<Key extends string, T extends Identifiable>(
  key: Key,
  repo: Repository<T>,
  compare: (a: T, b: T) => number,
  { pending, complete }: CollectionStoreOptions<T> = {},
): StoreApi<CollectionState<Key, T>> {
  const mirror = mirrorSlice<T, T[]>(
    key,
    repo,
    [],
    (entities) => (complete ? entities.map(complete) : [...entities]).sort(compare),
    pending,
  )
  return createStore<CollectionState<Key, T>>(
    (set) =>
      ({
        ...mirror(set as SetPartial),
        async remove(id: string) {
          await repo.remove(id)
          await pending?.remove(id)
        },
      }) as unknown as CollectionState<Key, T>,
  )
}

export function createSingletonStore<Key extends string, T extends Identifiable>(
  key: Key,
  repo: Repository<T>,
  complete: (entity: T) => T = (entity) => entity,
): StoreApi<SingletonState<Key, T>> {
  const mirror = mirrorSlice<T, T | null>(key, repo, null, (entities) => {
    const entity = entities[0]
    return entity ? complete(entity) : null
  })
  return createStore<SingletonState<Key, T>>(
    (set) => mirror(set as SetPartial) as unknown as SingletonState<Key, T>,
  )
}
