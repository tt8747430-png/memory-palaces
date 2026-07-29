import type { StoreApi } from 'zustand/vanilla'
import { nowIso } from './clock'
import type { Entity } from './entity'
import { requireEntity } from './entity'
import type { CollectionState } from './entity-store'
import { reorderById } from './order'

/** A collection store whose rows carry a manual `order`. */
export type OrderedStore<Key extends string, T extends Entity & { order: number }> = StoreApi<
  CollectionState<Key, T>
>

export interface CollectionCommandSpec<T, Changes> {
  /** How the subject is named in the error a stale id throws. */
  label: string
  /** The slice's own validating updater — the only place invariants live. */
  update: (entity: T, changes: Changes, updatedAt: string) => T
}

/**
 * The four commands every ordered collection answers the same way. A slice
 * hands over its state key, its name and its updater; everything else — when
 * `updatedAt` is stamped, which rows a reorder actually writes, what a stale id
 * throws — is decided here so it cannot drift between decks, cards, questions
 * and folders.
 */
export interface CollectionCommands<
  Key extends string,
  T extends Entity & { order: number },
  Changes,
> {
  require: (store: OrderedStore<Key, T>, id: string) => T
  edit: (store: OrderedStore<Key, T>, id: string, changes: Changes) => Promise<T>
  remove: (store: OrderedStore<Key, T>, id: string) => Promise<void>
  reorder: (store: OrderedStore<Key, T>, orderedIds: readonly string[]) => Promise<void>
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

    async edit(store, id, changes) {
      const updated = update(require(store, id), changes, nowIso())
      await store.getState().save(updated)
      return updated
    },

    remove: (store, id) => store.getState().remove(id),

    reorder(store, orderedIds) {
      const now = nowIso()
      // `order` is optional on every slice's change type, but a generic cannot
      // see that; the updater validates it either way.
      return reorderById(rows(store), orderedIds, (entity, order) =>
        store.getState().save(update(entity, { order } as Changes, now)),
      )
    },
  }
}
