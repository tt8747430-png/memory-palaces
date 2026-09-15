import type { CloudSyncPort } from '@/shared/api'
import type { DeckStore } from '@/entities/deck'
import type { CardStore } from '@/entities/card'
import type { FolderStore } from '@/entities/folder'
import type { QuestionStore } from '@/entities/question'
import type { PendingChangeStore } from '@/entities/pending-change'
import type { SyncStateStore } from '@/entities/sync-state'

export interface SyncDeps {
  cloud: CloudSyncPort
  pendingChangeStore: PendingChangeStore
  syncStateStore: SyncStateStore
  deckStore: DeckStore
  folderStore: FolderStore
  cardStore: CardStore
  questionStore: QuestionStore
  now: () => string
  isOnline: () => boolean
}
