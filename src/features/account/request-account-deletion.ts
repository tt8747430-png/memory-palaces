import type { AccountDeletionPort } from '@/shared/api'
import { errorMessage } from '@/shared/lib'
import {
  type DeletionReadiness,
  type PrepareAccountDeletionDeps,
  prepareAccountDeletion,
} from './prepare-account-deletion'

export interface RequestAccountDeletionDeps extends PrepareAccountDeletionDeps {
  deletion: AccountDeletionPort
  /** Wipes the device's database and reloads. */
  resetLocalData: () => Promise<void>
  signOut: () => Promise<void>
}

export type DeletionRequest =
  | Exclude<DeletionReadiness, { kind: 'ready' }>
  | { kind: 'scheduled'; purgeAfter: string }
  | { kind: 'failed'; reason: string }

/**
 * Schedules the account's purge and leaves the device empty.
 *
 * It runs `prepareAccountDeletion` again even though the person was only shown the confirmation
 * after one succeeded: typing the word takes long enough for a write to land, and a write the cloud
 * never saw is a write the wipe would erase. On a device that is already in step it is one peek and
 * an empty cycle.
 *
 * Squarely category A under ADR 0004: the server must answer now, so it is gated offline before the
 * press rather than failing into a toast.
 */
export async function requestAccountDeletion(
  deps: RequestAccountDeletionDeps,
): Promise<DeletionRequest> {
  const readiness = await prepareAccountDeletion(deps)
  if (readiness.kind !== 'ready') return readiness

  try {
    const scheduled = await deps.deletion.request()
    // Only now: the cloud has everything, so the device holds nothing that is not also elsewhere.
    await deps.signOut()
    await deps.resetLocalData()
    return { kind: 'scheduled', purgeAfter: scheduled.purgeAfter }
  } catch (error) {
    return { kind: 'failed', reason: errorMessage(error) }
  }
}
