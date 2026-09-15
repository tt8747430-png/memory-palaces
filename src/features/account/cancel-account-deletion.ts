import type { AccountDeletionPort } from '@/shared/api'
import type { SyncOutcome } from '@/shared/lib'

export interface CancelAccountDeletionDeps {
  deletion: AccountDeletionPort
  restore: () => Promise<SyncOutcome>
}

export async function cancelAccountDeletion(
  deps: CancelAccountDeletionDeps,
): Promise<{ restoring: Promise<SyncOutcome> }> {
  await deps.deletion.cancel()
  return { restoring: deps.restore() }
}
