import type { Identifiable } from '@/shared/api'
import { CONTENT_COLLECTIONS, type ContentCollection } from '@/shared/config/sync-tables'
import type { SyncDocumentRef } from '@/shared/lib'
import type { SyncDeps } from './sync-deps'

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

function writer<T extends Identifiable>(store: WritableStore<T>): ContentWriter {
  return {
    save: async (document) => {
      await store.getState().save(document as T)
    },
    remove: (id) => store.getState().remove(id),
  }
}

interface Named {
  name?: string
  front?: string
  prompt?: string
}

interface ContentAccess {
  writer: (deps: SyncDeps) => ContentWriter
  rows: (deps: SyncDeps) => readonly Identifiable[]
  label: (document: Named) => string | undefined
}

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

export const contentLabel = (
  collection: ContentCollection,
  document: Identifiable & Named,
): string => CONTENT[collection].label(document)?.trim() || document.id

export interface CloudCopy {
  collection: ContentCollection
  document: Identifiable & Named
}

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
