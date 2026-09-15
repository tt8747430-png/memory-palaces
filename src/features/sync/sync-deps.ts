import type { CloudSyncPort } from '@/shared/api'
import type { DeckStore } from '@/entities/deck'
import type { CardStore } from '@/entities/card'
import type { FolderStore } from '@/entities/folder'
import type { QuestionStore } from '@/entities/question'
import type { PendingChangeStore } from '@/entities/pending-change'
import type { SyncStateStore } from '@/entities/sync-state'

/**
 * What every Sync command needs. One shape, because the cycle, the review and the toggle all read
 * the same two bookkeeping stores and the same four content stores, and splitting them would only
 * mean four call sites assembling four subsets of the same object.
 */
export interface SyncDeps {
  cloud: CloudSyncPort
  pendingChangeStore: PendingChangeStore
  syncStateStore: SyncStateStore
  deckStore: DeckStore
  folderStore: FolderStore
  cardStore: CardStore
  questionStore: QuestionStore
  /** Injected so a test can pin the stamp on `lastSyncedAt`. */
  now: () => string
  /** Injected so a test does not depend on `navigator.onLine`. */
  isOnline: () => boolean
}
