import { createContext, useContext } from 'react'
import type { ContentCollection } from '@/shared/config/sync-tables'

export interface SyncDocumentRef {
  collection: ContentCollection
  id: string
}

/**
 * One document a destructive divergence is asking about.
 *
 * `descendants` is only ever set on a deck or folder: the documents another device added or edited
 * *inside* it, which this device has never seen. They are not asked about one by one — the person
 * deleted the container, not them — but they share its fate: Keep brings them in with it, Delete
 * tombstones them too so they do not arrive as orphans.
 */
export interface SyncReviewItem extends SyncDocumentRef {
  descendants?: readonly SyncDocumentRef[]
}

export interface SyncReviewRow extends SyncReviewItem {
  /** What to call the document in the dialog — read off the cloud's copy, not this device's. */
  label: string
}

export interface SyncReviewDecision extends SyncReviewItem {
  /** `false` — the dialog's default — is the user's own recent intent: let the deletion stand. */
  keep: boolean
}

/**
 * The rows of an open review, as they load. The question is known the moment a Sync stops; the
 * names are read off the cloud's copies afterwards, because this device's copies are the ones it
 * deleted. `failed` is the one state that offers a retry, and it retries only the names.
 */
export type SyncReviewRows =
  { state: 'loading' } | { state: 'failed' } | { state: 'ready'; rows: SyncReviewRow[] }

export interface SyncReview {
  /** What is being asked about. One array for the life of the review — it is the review's identity. */
  items: SyncReviewItem[]
  rows: SyncReviewRows
}

/**
 * Every way a Sync can end. A discriminated union, and every caller handles all five — there is no
 * default branch anywhere, because "something else happened" is not a state the banner can render.
 */
export type SyncOutcome =
  | { kind: 'clean' }
  | { kind: 'merged' }
  | { kind: 'needs-review'; items: SyncReviewItem[] }
  | { kind: 'offline' }
  | { kind: 'failed'; reason: string }

/**
 * Where a Sync is, as the banner sees it. `restoring` is its own phase rather than a flavour of
 * `syncing` because it is the one Sync the user did not ask for — the forced pull after a
 * cancelled account deletion, which has to explain itself.
 */
export type SyncPhase = 'idle' | 'syncing' | 'synced' | 'failed' | 'restoring'

/**
 * The running Sync, as the UI can drive it.
 *
 * A context rather than a global store, and provided by `SyncProvider`, because it is genuinely
 * absent in two cases the UI has to render differently from "nothing pending": no Supabase project
 * is configured, and the current identity is a guest. `useSyncRunner` returns `null` for both, and
 * the banner hides.
 *
 * Scheduling lives in the provider, classification in `syncNow`, the replication lifecycle in
 * `SyncManager` and Realtime in `CloudWatcher`. This is only the handle between them and a button.
 */
export interface SyncRunner {
  phase: SyncPhase
  /** The reason a Sync failed, for the banner to show beside Retry. */
  error: string | null
  /** The open review, or null. Non-null means a Sync is paused waiting for an answer. */
  review: SyncReview | null
  /** Press Synchronise. Resolves once the Sync has settled, with what it settled as. */
  run: () => Promise<SyncOutcome>
  /**
   * One Sync regardless of Autosync, with the banner in its Restoring state — the forced pull
   * after a cancelled account deletion, which is the one Sync the user did not ask for.
   */
  restore: () => Promise<SyncOutcome>
  /**
   * Open the review on demand, applying nothing. Resolves `needs-review` when there is something to
   * answer (and the dialog opens), `clean` when there is not.
   */
  openReview: () => Promise<SyncOutcome>
  /** Answer the review and finish the Sync it interrupted. */
  resolve: (decisions: readonly SyncReviewDecision[]) => Promise<SyncOutcome>
  /** Dismiss the review, cancelling the Sync entirely. Nothing is half-applied. */
  dismiss: () => void
  /** Read the open review's names off the cloud again, after a load that failed. */
  reloadReview: () => void
}

export const SyncRunnerContext = createContext<SyncRunner | null>(null)

/** Null when there is nothing to sync — no project configured, or a guest identity. */
export function useSyncRunner(): SyncRunner | null {
  return useContext(SyncRunnerContext)
}
