import type { CloudSyncPort } from '@/shared/api'
import type { SyncedTable } from '@/shared/config/sync-tables'
import type { DeckStore } from '@/entities/deck'
import type { CardStore } from '@/entities/card'
import type { FolderStore } from '@/entities/folder'
import type { QuestionStore } from '@/entities/question'
import type { PendingChangeStore } from '@/entities/pending-change'
import type { SyncStateStore } from '@/entities/sync-state'

export interface SyncDeps {
  cloud: CloudSyncPort
  /**
   * Every table a cycle covers, core plus whatever the enabled extensions contributed. Passed in
   * rather than imported, because the list is composed at startup and this layer cannot see it.
   */
  tables: readonly SyncedTable[]
  pendingChangeStore: PendingChangeStore
  syncStateStore: SyncStateStore
  deckStore: DeckStore
  folderStore: FolderStore
  cardStore: CardStore
  questionStore: QuestionStore
  now: () => string
  isOnline: () => boolean
  /**
   * Asks the account gateway for a fresh access token. A cycle the server refused over the token
   * it was handed gets exactly one more try behind a new one; without this, an expired token
   * reads to the learner as "Sync did not finish" forever.
   */
  refreshAuth: () => Promise<boolean>
}
