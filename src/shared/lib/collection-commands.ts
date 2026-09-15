import type { StoreApi } from 'zustand/vanilla'
import { nowIso } from './clock'
import type { Entity } from './entity'
import { requireEntity } from './entity'
import type { CollectionState } from './entity-store'
import { reorderById } from './order'

export type OrderedStore<Key extends string, T extends Entity & { order: number }> = StoreApi<
  CollectionState<Key, T>
>

export interface CollectionCommandSpec<T, Changes> {
  label: string
  update: (entity: T, changes: Changes, updatedAt: string) => T
}

export interface CollectionCommands<
  Key extends string,
  T extends Entity & { order: number },
  Changes,
> {
  require: (store: OrderedStore<Key, T>, id: string) => T
  edit: (store: OrderedStore<Key, T>, id: string, changes: Changes, now?: number) => Promise<T>
  remove: (store: OrderedStore<Key, T>, id: string) => Promise<void>
  reorder: (
    store: OrderedStore<Key, T>,
    orderedIds: readonly string[],
    now?: number,
  ) => Promise<void>
}

export function collectionCommands<
  Key extends string,
  T extends Entity & { order: number },
  Changes extends { order?: number },
>(
  key: Key,
  { label, update }: CollectionCommandSpec<T, Changes>,
): CollectionCommands<Key, T, Changes> {
  const rows = (store: OrderedStore<Key, T>): T[] => store.getState()[key]
  const require = (store: OrderedStore<Key, T>, id: string): T =>
    requireEntity(rows(store), id, label)

  return {
    require,

    async edit(store, id, changes, now = Date.now()) {
      const updated = update(require(store, id), changes, nowIso(now))
      await store.getState().save(updated)
      return updated
    },

    remove: (store, id) => store.getState().remove(id),

    reorder(store, orderedIds, now = Date.now()) {
      const updatedAt = nowIso(now)
      return reorderById(rows(store), orderedIds, (entity, order) =>
        store.getState().save(update(entity, { order } as Changes, updatedAt)),
      )
    },
  }
}
