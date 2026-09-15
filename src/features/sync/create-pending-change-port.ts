import type { PendingChangePort } from '@/shared/lib'
import type { ContentCollection } from '@/shared/config/sync-tables'
import { makePendingChange, type PendingChangeStore } from '@/entities/pending-change'

/**
 * The port the composition root hands to one content store, with the collection already bound —
 * which is what lets `entity-store` record pending changes while staying ignorant of any
 * particular collection.
 *
 * `save` upserts under `${collection}:${entityId}`, so repeated edits collapse onto one entry and a
 * save after a remove replaces the remove. The log records the document's *net* state relative to
 * the last Sync, not its history.
 */
export function createPendingChangePort(
  store: PendingChangeStore,
  collection: ContentCollection,
  now: () => string,
): PendingChangePort {
  const record = async (entityId: string, op: 'save' | 'remove') => {
    await store.getState().save(makePendingChange({ collection, entityId, op, at: now() }))
  }
  return {
    save: (entityId) => record(entityId, 'save'),
    remove: (entityId) => record(entityId, 'remove'),
  }
}
