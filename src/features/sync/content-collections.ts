import type { Identifiable } from '@/shared/api'
import { CONTENT_COLLECTIONS, type ContentCollection } from '@/shared/config/sync-tables'
import type { SyncDocumentRef } from '@/shared/lib'
import type { SyncDeps } from './sync-deps'

/**
 * The two writes a Sync makes into a content store, over whatever document the cloud holds.
 *
 * Going through the store rather than the repository is the point: the store's write is what
 * records the pending change, and a restored copy the log did not see would be a change no Sync
 * could ever confirm.
 */
export interface ContentWriter {
  save(document: Identifiable): Promise<void>
  remove(id: string): Promise<void>
}

interface WritableStore<T extends Identifiable> {
  getState: () => {
    save: (entity: T) => Promise<T>
    remove: (id: string) => Promise<void>
  }
}

/**
 * The one place the cloud's untyped document meets a store's typed `save`. The copy came from this
 * collection's own table, so it is a `T` in every sense the store can check — the same trust every
 * pulled row gets — and the store's `complete` repairs it on the way back out, as it does for those.
 */
function writer<T extends Identifiable>(store: WritableStore<T>): ContentWriter {
  return {
    save: async (document) => {
      await store.getState().save(document as T)
    },
    remove: (id) => store.getState().remove(id),
  }
}

/** The fields a content document may be named by. Which one depends on its collection. */
interface Named {
  name?: string
  front?: string
  prompt?: string
}

interface ContentAccess {
  writer: (deps: SyncDeps) => ContentWriter
  /** What this device currently holds. */
  rows: (deps: SyncDeps) => readonly Identifiable[]
  /** What to call one document in the review dialog. */
  label: (document: Named) => string | undefined
}

/**
 * The four content collections, as one table. Every place the sync has to treat a deck, folder,
 * card or question differently reads it from here, so adding a content collection is one entry
 * rather than a case in three switches.
 */
const CONTENT: Record<ContentCollection, ContentAccess> = {
  folders: {
    writer: (deps) => writer(deps.folderStore),
    rows: (deps) => deps.folderStore.getState().folders,
    label: (document) => document.name,
  },
  decks: {
    writer: (deps) => writer(deps.deckStore),
    rows: (deps) => deps.deckStore.getState().decks,
    label: (document) => document.name,
  },
  cards: {
    writer: (deps) => writer(deps.cardStore),
    rows: (deps) => deps.cardStore.getState().cards,
    label: (document) => document.front,
  },
  questions: {
    writer: (deps) => writer(deps.questionStore),
    rows: (deps) => deps.questionStore.getState().questions,
    label: (document) => document.prompt,
  },
}

export const contentWriter = (deps: SyncDeps, collection: ContentCollection): ContentWriter =>
  CONTENT[collection].writer(deps)

export const localIds = (deps: SyncDeps, collection: ContentCollection): Set<string> =>
  new Set(CONTENT[collection].rows(deps).map((row) => row.id))

/** A document's name for the dialog, falling back to its id rather than a blank row. */
export const contentLabel = (
  collection: ContentCollection,
  document: Identifiable & Named,
): string => CONTENT[collection].label(document)?.trim() || document.id

/** One document the cloud still holds, with the replication's tombstone flag already stripped. */
export interface CloudCopy {
  collection: ContentCollection
  document: Identifiable & Named
}

/**
 * The cloud's live copies of `refs`: one fetch per collection, all at once, and only for the ids
 * asked for. A tombstoned row is dropped rather than returned — there is nothing there to keep,
 * to name, or to re-delete — and the `_deleted` flag comes off the rest, because it is the cloud's
 * flag and not a field of any entity.
 */
export async function fetchCloudCopies(
  deps: SyncDeps,
  refs: readonly SyncDocumentRef[],
): Promise<CloudCopy[]> {
  const copies = await Promise.all(
    CONTENT_COLLECTIONS.map(async (collection) => {
      const ids = refs.filter((ref) => ref.collection === collection).map((ref) => ref.id)
      if (!ids.length) return []
      const documents = await deps.cloud.fetch<Identifiable & Named>(collection, ids)
      return documents.flatMap(({ _deleted, ...document }) =>
        _deleted ? [] : [{ collection, document }],
      )
    }),
  )
  return copies.flat()
}
