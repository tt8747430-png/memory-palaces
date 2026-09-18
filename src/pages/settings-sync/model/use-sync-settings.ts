import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  type ContentCollection,
  isContentCollection,
  type SyncedTable,
} from '@/shared/config/sync-tables'
import {
  selectIsReady,
  type SyncRunner,
  useContributedT,
  useOnline,
  useSyncRunner,
} from '@/shared/lib'
import { selectCards, useCardStore } from '@/entities/card'
import { selectDecks, useDeckStore } from '@/entities/deck'
import { selectFolders, useFolderStore } from '@/entities/folder'
import { selectQuestions, useQuestionStore } from '@/entities/question'
import {
  pendingByTable,
  pendingIn,
  selectPendingChanges,
  usePendingChangeStore,
} from '@/entities/pending-change'
import { selectAutosync, usePreferencesStore, usePreferencesStoreApi } from '@/entities/preferences'
import { selectSessionKind, useSessionStore } from '@/entities/session'
import {
  selectLastSyncedAt,
  selectSyncLog,
  type SyncLogEntry,
  useSyncStateStore,
} from '@/entities/sync-state'
import { setPreferences } from '@/features/preferences'
import { type SyncStatus, syncStatus } from './status'
import { type WaitingItem, waitingItems } from './waiting-items'

export interface WaitingRow {
  table: SyncedTable
  label: string
  count: number
  /** A content table: the sheet can name what is waiting. Others show only the count. */
  openable: boolean
}

export interface SyncSettings {
  ready: boolean
  /** Null when there is nothing to synchronise: a guest, or a build without a cloud. */
  runner: SyncRunner | null
  guest: boolean
  status: SyncStatus
  error: string | null
  busy: boolean
  online: boolean
  lastSyncedAt: string | null
  account: string
  waiting: WaitingRow[]
  log: SyncLogEntry[]
  autosync: boolean

  sync: () => void
  setAutosync: (on: boolean) => void
  review: () => Promise<void>

  /** The content table whose waiting documents the sheet lists, or null while it is closed. */
  opened: ContentCollection | null
  openedItems: WaitingItem[]
  open: (table: SyncedTable) => void
  close: () => void

  repairAsked: boolean
  askRepair: () => void
  dismissRepair: () => void
  repair: () => Promise<void>
}

export function useSyncSettings(): SyncSettings {
  const { t } = useTranslation()
  const contributed = useContributedT()
  const runner = useSyncRunner()
  const online = useOnline()
  const kind = useSessionStore(selectSessionKind)
  const session = useSessionStore((state) => state.session)
  const syncStateReady = useSyncStateStore(selectIsReady)
  const preferencesReady = usePreferencesStore(selectIsReady)
  const changes = usePendingChangeStore(selectPendingChanges)
  const lastSyncedAt = useSyncStateStore(selectLastSyncedAt)
  const log = useSyncStateStore(selectSyncLog)
  const autosync = usePreferencesStore(selectAutosync)
  const preferencesStore = usePreferencesStoreApi()
  const decks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const folders = useFolderStore(selectFolders)
  const questions = useQuestionStore(selectQuestions)
  const [opened, setOpened] = useState<ContentCollection | null>(null)
  const [repairAsked, setRepairAsked] = useState(false)

  const live = useMemo(() => pendingIn(changes, runner?.tables ?? []), [changes, runner])
  const waiting = useMemo<WaitingRow[]>(() => {
    const counts = pendingByTable(live)
    return (runner?.tables ?? []).flatMap((table) => {
      const count = counts[table]
      if (!count) return []
      const key = runner?.labelKeys[table]
      const label = key ? contributed(key) : t(`sync.tables.${table}` as never)
      return [{ table, label, count, openable: isContentCollection(table) }]
    })
  }, [live, runner, contributed, t])

  const nameOf = useCallback(
    (collection: ContentCollection, id: string): string | undefined => {
      switch (collection) {
        case 'decks':
          return decks.find((deck) => deck.id === id)?.name
        case 'folders':
          return folders.find((folder) => folder.id === id)?.name
        case 'cards':
          return cards.find((card) => card.id === id)?.front
        case 'questions':
          return questions.find((question) => question.id === id)?.prompt
      }
    },
    [decks, folders, cards, questions],
  )
  const openedItems = useMemo(
    () => (opened ? waitingItems(live, opened, nameOf) : []),
    [live, opened, nameOf],
  )

  const phase = runner?.phase ?? 'idle'
  const busy = phase === 'syncing' || phase === 'restoring'

  const review = async () => {
    if (!runner) return
    const outcome = await runner.openReview()
    switch (outcome.kind) {
      case 'needs-review':
        return
      case 'clean':
      case 'merged':
        toast(t('sync.settings.nothingToReview'))
        return
      case 'offline':
        toast.error(t('common.offline'))
        return
      case 'failed':
        toast.error(t('sync.settings.reviewFailed'))
        return
    }
  }

  const repair = async () => {
    setRepairAsked(false)
    if (!runner) return
    const outcome = await runner.repair()
    switch (outcome.kind) {
      case 'clean':
      case 'merged':
        toast.success(t('sync.settings.checkEverythingDone'))
        return
      case 'needs-review':
        return
      case 'offline':
        toast.error(t('common.offline'))
        return
      case 'failed':
        toast.error(t('sync.settings.checkEverythingFailed', { reason: outcome.reason }))
        return
    }
  }

  return {
    ready: syncStateReady && preferencesReady,
    runner,
    guest: kind === 'guest',
    status: syncStatus({ phase, waiting: live.length, online }),
    error: runner?.error ?? null,
    busy,
    online,
    lastSyncedAt,
    account: session?.displayName ?? '',
    waiting,
    log,
    autosync,
    sync: () => void runner?.run(),
    setAutosync: (on) => void setPreferences(preferencesStore, { autosync: on }),
    review,
    opened,
    openedItems,
    open: (table) => {
      if (isContentCollection(table)) setOpened(table)
    },
    close: () => setOpened(null),
    repairAsked,
    askRepair: () => setRepairAsked(true),
    dismissRepair: () => setRepairAsked(false),
    repair,
  }
}
