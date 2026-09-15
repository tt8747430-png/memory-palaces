import type { SyncOutcome } from '@/shared/lib'

export interface PrepareAccountDeletionDeps {
  /** One Sync, and its outcome. */
  sync: () => Promise<SyncOutcome>
  isOnline: () => boolean
}

/**
 * Whether the account may be deleted *now*: online, and nothing on this device the cloud lacks.
 * `needs-review` and `sync-failed` are separate because they ask different things of the person —
 * one is an answer about their own deletions, the other a retry.
 */
export type DeletionReadiness =
  | { kind: 'ready' }
  | { kind: 'offline' }
  | { kind: 'needs-review' }
  | { kind: 'sync-failed'; reason: string }

/**
 * The Sync that has to succeed before an account may be deleted.
 *
 * With Autosync off the device may hold weeks of work the cloud has never seen, and deleting wipes
 * the device — which would destroy exactly what cancelling the deletion is supposed to bring back.
 * The only reason the wipe is safe is that the cloud has everything, so if the cloud does not,
 * nothing is offered.
 */
export async function prepareAccountDeletion(
  deps: PrepareAccountDeletionDeps,
): Promise<DeletionReadiness> {
  if (!deps.isOnline()) return { kind: 'offline' }
  const outcome = await deps.sync()
  switch (outcome.kind) {
    case 'clean':
    case 'merged':
      return { kind: 'ready' }
    case 'needs-review':
      return { kind: 'needs-review' }
    case 'offline':
      return { kind: 'offline' }
    case 'failed':
      return { kind: 'sync-failed', reason: outcome.reason }
  }
}
