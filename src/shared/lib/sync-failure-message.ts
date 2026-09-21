import type { TFunction } from 'i18next'

/**
 * A failed Sync's reason as the learner should read it. `syncNow` records the two auth failures
 * as codes rather than as whatever the server said — "invalid JWT: unable to parse or verify
 * signature" tells a learner nothing, and the action it calls for is not Retry. Anything else is
 * repeated verbatim: a message we have not seen before is better than a shrug.
 */
export function syncFailureMessage(t: TFunction, reason: string | null): string | null {
  if (!reason) return null
  if (reason === 'token' || reason === 'clock') return t(`sync.failure.${reason}` as never)
  return reason
}
