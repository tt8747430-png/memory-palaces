import { createContext, useContext } from 'react'
import type { ScheduledDeletion } from '@/shared/api'

/**
 * What `AuthProvider` found when the session became an account.
 *
 * - `checking` — the check is in flight. The app is held back, so an account on its way to being
 *   destroyed is never browsed into.
 * - `scheduled` — it is. The gate offers cancel or sign out, and nothing else.
 * - `clear` — it is not, or there is no account, or no cloud.
 * - `unknown` — the check could not answer (offline, or slower than `CHECK_BUDGET_MS`). The app opens:
 *   Mindscape studies offline, and holding every launch hostage to a round trip would break that. It
 *   is safe because requesting deletion signs every device out, so the only way to hold a session
 *   on a scheduled account is to sign in — which needs the network the check then has. The check
 *   keeps going, and runs again on reconnect.
 */
export type ScheduledDeletionCheck =
  | { status: 'checking' }
  | { status: 'scheduled'; deletion: ScheduledDeletion }
  | { status: 'clear' }
  | { status: 'unknown' }

export interface ScheduledDeletionState {
  check: ScheduledDeletionCheck
  /** Told once the deletion has been cancelled, so the app can open while the restore runs. */
  cancelled: () => void
}

export const ScheduledDeletionContext = createContext<ScheduledDeletionState>({
  check: { status: 'clear' },
  cancelled: () => {},
})

export const useScheduledDeletion = (): ScheduledDeletionState =>
  useContext(ScheduledDeletionContext)
