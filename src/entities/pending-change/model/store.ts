import type { StoreApi } from 'zustand/vanilla'
import { type CollectionState, createCollectionStore } from '@/shared/lib'
import type { PendingChangeRepository } from '@/entities/pending-change'
import type { PendingChange } from './types'

export type PendingChangeState = CollectionState<'pendingChanges', PendingChange>
export type PendingChangeStore = StoreApi<PendingChangeState>

/** Oldest first: the log reads as the order the device made its changes in. */
const byWriteTime = (a: PendingChange, b: PendingChange): number =>
  a.at.localeCompare(b.at) || a.id.localeCompare(b.id)

/**
 * Never given a `PendingChangePort` of its own — a log of unsynced writes that logged its own
 * writes would never empty.
 */
export function createPendingChangeStore(repo: PendingChangeRepository): PendingChangeStore {
  return createCollectionStore('pendingChanges', repo, byWriteTime)
}
