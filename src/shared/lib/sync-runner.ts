import { createContext, useContext } from 'react'
import type { ContentCollection, SyncedTable } from '@/shared/config/sync-tables'

export interface SyncDocumentRef {
  collection: ContentCollection
  id: string
}

export interface SyncReviewItem extends SyncDocumentRef {
  descendants?: readonly SyncDocumentRef[]
}

export interface SyncReviewRow extends SyncReviewItem {
  label: string
}

export interface SyncReviewDecision extends SyncReviewItem {
  keep: boolean
}

export type SyncReviewRows =
  { state: 'loading' } | { state: 'failed' } | { state: 'ready'; rows: SyncReviewRow[] }

export interface SyncReview {
  items: SyncReviewItem[]
  rows: SyncReviewRows
}

export type SyncOutcome =
  | { kind: 'clean' }
  | { kind: 'merged' }
  | { kind: 'needs-review'; items: SyncReviewItem[] }
  | { kind: 'offline' }
  | { kind: 'failed'; reason: string }

export type SyncPhase = 'idle' | 'syncing' | 'synced' | 'failed' | 'restoring'

export interface SyncRunner {
  phase: SyncPhase
  error: string | null
  review: SyncReview | null
  /** The tables a Sync covers right now — what counts as waiting, and what a cycle carries. */
  tables: readonly SyncedTable[]
  /** The key naming each contributed table to a learner; a core table is named by the app. */
  labelKeys: Readonly<Partial<Record<SyncedTable, string>>>
  run: () => Promise<SyncOutcome>
  restore: () => Promise<SyncOutcome>
  /** Reads the whole cloud again and reconciles every local document against it. */
  repair: () => Promise<SyncOutcome>
  openReview: () => Promise<SyncOutcome>
  resolve: (decisions: readonly SyncReviewDecision[]) => Promise<SyncOutcome>
  dismiss: () => void
  reloadReview: () => void
}

export const SyncRunnerContext = createContext<SyncRunner | null>(null)

export function useSyncRunner(): SyncRunner | null {
  return useContext(SyncRunnerContext)
}
