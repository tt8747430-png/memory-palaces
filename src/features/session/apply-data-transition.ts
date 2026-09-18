import type { DataOwner, DataTransition } from '@/shared/lib'
import type { RemoteChangeEvent } from '@/shared/api'
import type { SyncManager } from '@/shared/api/supabase'
import type { SyncedTable } from '@/shared/config/sync-tables'

export interface ApplyDataTransitionDeps {
  transition: DataTransition
  userId: string
  syncManager: Pick<SyncManager, 'start' | 'stop'>
  /** The tables live right now — core plus the enabled extensions'. */
  tables: readonly SyncedTable[]
  onRemoteChange?: (event: RemoteChangeEvent) => void
  dataOwner: DataOwner
  resetLocal: () => Promise<void>
}

export async function applyDataTransition({
  transition,
  userId,
  syncManager,
  tables,
  dataOwner,
  resetLocal,
  onRemoteChange,
}: ApplyDataTransitionDeps): Promise<void> {
  if (transition === 'reset') {
    await syncManager.stop()
    dataOwner.claim(userId)
    await resetLocal()
    return
  }
  dataOwner.claim(userId)
  await syncManager.start(userId, tables, onRemoteChange)
}
