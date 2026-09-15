import type { StoreApi } from 'zustand/vanilla'
import { type CollectionState, createCollectionStore } from '@/shared/lib'
import type { PendingChangeRepository } from '@/entities/pending-change'
import type { PendingChange } from './types'

export type PendingChangeState = CollectionState<'pendingChanges', PendingChange>
export type PendingChangeStore = StoreApi<PendingChangeState>

const byWriteTime = (a: PendingChange, b: PendingChange): number =>
  a.at.localeCompare(b.at) || a.id.localeCompare(b.id)

export function createPendingChangeStore(repo: PendingChangeRepository): PendingChangeStore {
  return createCollectionStore('pendingChanges', repo, byWriteTime)
}
