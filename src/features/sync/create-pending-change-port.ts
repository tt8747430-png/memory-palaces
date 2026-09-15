import type { PendingChangePort } from '@/shared/lib'
import type { ContentCollection } from '@/shared/config/sync-tables'
import { makePendingChange, type PendingChangeStore } from '@/entities/pending-change'

export function createPendingChangePort(
  store: PendingChangeStore,
  collection: ContentCollection,
  now: () => string,
): PendingChangePort {
  const record = async (entityId: string, op: 'save' | 'remove') => {
    await store
      .getState()
      .save(makePendingChange({ contentCollection: collection, entityId, op, at: now() }))
  }
  return {
    save: (entityId) => record(entityId, 'save'),
    remove: (entityId) => record(entityId, 'remove'),
  }
}
