import { errorMessage, syncFailure, type SyncOutcome } from '@/shared/lib'

/**
 * The outcome of a cycle that threw. A failure the app recognises is recorded as its code, so
 * the banner and the log can say what it means; anything else is kept as the server said it.
 */
export const failed = (error: unknown): SyncOutcome => {
  const reason = errorMessage(error)
  return { kind: 'failed', reason: syncFailure(reason) ?? reason }
}
