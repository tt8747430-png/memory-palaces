import type { AccountDeletionPort } from '@/shared/api'
import { errorMessage } from '@/shared/lib'
import {
  type DeletionReadiness,
  type PrepareAccountDeletionDeps,
  prepareAccountDeletion,
} from './prepare-account-deletion'

export interface RequestAccountDeletionDeps extends PrepareAccountDeletionDeps {
  deletion: AccountDeletionPort
  resetLocalData: () => Promise<void>
  signOut: () => Promise<void>
}

export type DeletionRequest =
  | Exclude<DeletionReadiness, { kind: 'ready' }>
  | { kind: 'scheduled'; purgeAfter: string }
  | { kind: 'failed'; reason: string }

export async function requestAccountDeletion(
  deps: RequestAccountDeletionDeps,
): Promise<DeletionRequest> {
  const readiness = await prepareAccountDeletion(deps)
  if (readiness.kind !== 'ready') return readiness

  try {
    const scheduled = await deps.deletion.request()
    await deps.signOut()
    await deps.resetLocalData()
    return { kind: 'scheduled', purgeAfter: scheduled.purgeAfter }
  } catch (error) {
    return { kind: 'failed', reason: errorMessage(error) }
  }
}
