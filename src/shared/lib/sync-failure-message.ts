import type { TFunction } from 'i18next'

import type { SyncFailure } from './sync-failure'

const CODES: ReadonlySet<string> = new Set<SyncFailure>(['token', 'clock', 'network'])

/**
 * A failed Sync's reason as the learner should read it. `syncNow` records the failures it
 * recognises as codes rather than as whatever the server or the browser said — "invalid JWT:
 * unable to parse or verify signature" and "AbortError: Fetch is aborted" tell a learner nothing.
 * Anything else is repeated verbatim: a message we have not seen before is better than a shrug.
 */
export function syncFailureMessage(t: TFunction, reason: string | null): string | null {
  if (!reason) return null
  return CODES.has(reason) ? t(`sync.failure.${reason as SyncFailure}` as never) : reason
}
