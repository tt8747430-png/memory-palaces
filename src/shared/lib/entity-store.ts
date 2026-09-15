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
 * Where a store reports the writes a Sync has not carried yet.
 *
 * A port rather than a direct write, because `entity-store` is generic over every slice and must
 * stay ignorant of any particular collection — the collection is bound when the composition root
 * builds the port, so nothing here knows a `decks` from a `questions`. A test supplies a fake
 * instead of a database.
 *
 * Only the four content stores are given one. Everything else — the singletons that always merge,
 * and the device-local collections with nowhere to push — passes `undefined` and records nothing.
 */
export interface PendingChangePort {
  save: (entityId: string) => Promise<void>
  remove: (entityId: string) => Promise<void>
}

export interface CollectionStoreOptions<T> {
  /** Records writes the cloud has not confirmed. Only the four content stores are given one. */
  pending?: PendingChangePort
  /**
   * Repairs a document on the way in. Same contract as `createSingletonStore`'s: a schema
   * migration only fixes what is already on this device, and a document arriving over replication
   * was written by whichever build the other device runs. So the entity — not the screen reading
   * it — decides what an unrecognised value means, once, here.
   */
  complete?: (entity: T) => T
}

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

    // Recorded *after* the write lands: a save that threw changed nothing, and a log entry for it
    // would inflate the banner with a change no Sync could ever carry.
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

/**
 * `complete` fills fields the stored document predates. A schema migration only repairs what is
 * already on this device; a document that arrives over replication was written by whichever build
 * the other device runs and is stored at the current version untouched. So the entity — not the
 * screen reading it — decides what a missing field means, once, on the way in.
 */
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
