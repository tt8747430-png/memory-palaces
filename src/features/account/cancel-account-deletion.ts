import type { AccountDeletionPort } from '@/shared/api'
import type { SyncOutcome } from '@/shared/lib'

export interface CancelAccountDeletionDeps {
  deletion: AccountDeletionPort
  /**
   * Forces one Sync regardless of Autosync, with the banner in its Restoring state.
   * `SyncRunner.restore` is what the app passes here.
   */
  restore: () => Promise<SyncOutcome>
}

/**
 * Cancels a scheduled deletion and starts pulling the account's data back onto this device.
 *
 * Resolves as soon as the cancel lands, handing back the restore still in progress — the caller has
 * to open the app *while* it runs, or the banner's Restoring state would play behind a screen
 * nobody can see.
 *
 * **The restore is not optional and is not left to the user to discover.** Local was wiped at
 * request time, Autosync may be off on this device, and the banner's "nothing pending, cloud unchanged"
 * state is hidden — so without a forced Sync the user cancels and lands in an empty app with
 * nothing on screen telling them their decks are one press away.
 */
export async function cancelAccountDeletion(
  deps: CancelAccountDeletionDeps,
): Promise<{ restoring: Promise<SyncOutcome> }> {
  await deps.deletion.cancel()
  return { restoring: deps.restore() }
}
