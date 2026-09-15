/** An account that has asked to be destroyed, and when that becomes irreversible. */
export interface ScheduledDeletion {
  requestedAt: string
  purgeAfter: string
}

/**
 * Requesting, reading and cancelling an account's deletion.
 *
 * A port because every one of the three needs the server to answer *now* (ADR 0004) and none of
 * them is a document write: the schedule lives in `account_deletions`, which grants a client select
 * and delete and nothing else. Scheduling goes through an Edge Function, because it also has to
 * sign the user out globally.
 */
export interface AccountDeletionPort {
  /** The caller's own pending deletion, or null. Checked on every sign-in. */
  scheduled(): Promise<ScheduledDeletion | null>
  /** Schedules the purge and signs the user out everywhere. */
  request(): Promise<ScheduledDeletion>
  /** Cancels it. Signing in is what makes this reachable. */
  cancel(): Promise<void>
}
