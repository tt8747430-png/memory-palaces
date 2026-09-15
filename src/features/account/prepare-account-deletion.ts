import type { SyncOutcome } from '@/shared/lib'

export interface PrepareAccountDeletionDeps {
  sync: () => Promise<SyncOutcome>
  isOnline: () => boolean
}

export type DeletionReadiness =
  | { kind: 'ready' }
  | { kind: 'offline' }
  | { kind: 'needs-review' }
  | { kind: 'sync-failed'; reason: string }

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
