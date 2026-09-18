import type { PendingChangePort } from '@/shared/lib'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { makePendingChange, type PendingChangeStore } from '@/entities/pending-change'

/** The port a synced store writes through: every save and remove lands in the pending log. */
export function createPendingChangePort(
  store: PendingChangeStore,
  table: SyncedTable,
  now: () => string,
): PendingChangePort {
  const record = async (entityId: string, op: 'save' | 'remove') => {
    await store.getState().save(makePendingChange({ table, entityId, op, at: now() }))
  }
  return {
    save: (entityId) => record(entityId, 'save'),
    remove: (entityId) => record(entityId, 'remove'),
  }
}
