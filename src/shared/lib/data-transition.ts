export type DataTransition = 'keep' | 'reset'

/**
 * What must happen to the data already on this device when an account signs in.
 *
 * - Nobody owned it — a fresh install, or a guest who just signed up: **keep**. Everything studied
 *   so far is theirs, and the first push claims it.
 * - The same account signing back in: **keep**. The server has the same documents; replication
 *   reconciles them.
 * - A different account: **reset**. The decks on the device belong to someone else, and leaving
 *   them would push one person's study into another's account.
 *
 * The owner is asked, not the previous session: signing out clears the session but leaves the data,
 * so "who was here before" has to be remembered somewhere that survives it — see `DataOwner`.
 */
export function resolveDataTransition(ownerId: string | null, accountId: string): DataTransition {
  return ownerId === null || ownerId === accountId ? 'keep' : 'reset'
}
