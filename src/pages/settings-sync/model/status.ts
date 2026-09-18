import type { SyncPhase } from '@/shared/lib'

export type SyncStatus = 'syncing' | 'failed' | 'offline' | 'waiting' | 'synced'

export interface SyncStatusInput {
  phase: SyncPhase
  waiting: number
  online: boolean
}

/**
 * One word for where this device stands, in the order a learner needs to hear them: a cycle in
 * progress, then a failure to act on, then no network to act with, then what is waiting, then
 * nothing at all.
 */
export function syncStatus({ phase, waiting, online }: SyncStatusInput): SyncStatus {
  if (phase === 'syncing' || phase === 'restoring') return 'syncing'
  if (phase === 'failed') return 'failed'
  if (!online) return 'offline'
  return waiting > 0 ? 'waiting' : 'synced'
}
