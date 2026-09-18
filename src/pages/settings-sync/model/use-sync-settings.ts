import { useMemo } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  type ContentCollection,
  isContentCollection,
  isCoreSyncedTable,
  type SyncedTable,
} from '@/shared/config/sync-tables'
import {
  selectIsReady,
  type SyncRunner,
  useContributedT,
  useOnline,
  usePendingAct,
  useSyncRunner,
} from '@/shared/lib'
import { selectCards, useCardStoreApi } from '@/entities/card'
import { selectDecks, useDeckStoreApi } from '@/entities/deck'
import { selectFolders, useFolderStoreApi } from '@/entities/folder'
import { selectQuestions, useQuestionStoreApi } from '@/entities/question'
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
import { namesBy, type WaitingItem, waitingItems } from './waiting-items'

export interface WaitingRow {
  table: SyncedTable
  label: string
  count: number
  /** A content table: the sheet can name what is waiting. Others show only the count. */
  openable: boolean
}

/**
 * What the page has open over itself, or nothing — one value, so the repair question can never
 * stand over the waiting sheet. The sheet carries the names it opened with: a document's name is
 * read once, when the learner asks, rather than the page following every write to four tables.
 */
export type SyncSettingsPending =
  | {
      kind: 'waiting'
      table: ContentCollection
      label: string
      names: ReadonlyMap<string, string>
    }
  | { kind: 'repair' }

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
  /** The email the account signs in with; null for a guest. */
  account: string | null
  waiting: WaitingRow[]
  log: SyncLogEntry[]
  autosync: boolean

  sync: () => void
  setAutosync: (on: boolean) => void
  review: () => Promise<void>

  pending: SyncSettingsPending | null
  /** What the waiting sheet lists, while it is open; empty otherwise. */
  openedItems: WaitingItem[]
  /** Opens the waiting sheet over a content row; any other row has nothing more to show. */
  openWaiting: (row: WaitingRow) => void
  requestRepair: () => void
  dismiss: () => void
  /** Answers the repair question: checks everything against the cloud. */
  repair: () => Promise<void>
}

export function useSyncSettings(): SyncSettings {
  const { t } = useTranslation()
  const contributed = useContributedT()
  const runner = useSyncRunner()
  const online = useOnline()
  const kind = useSessionStore(selectSessionKind)
  const email = useSessionStore((state) => state.session?.email ?? null)
  const syncStateReady = useSyncStateStore(selectIsReady)
  const preferencesReady = usePreferencesStore(selectIsReady)
  const changes = usePendingChangeStore(selectPendingChanges)
  const lastSyncedAt = useSyncStateStore(selectLastSyncedAt)
  const log = useSyncStateStore(selectSyncLog)
  const autosync = usePreferencesStore(selectAutosync)
  const preferencesStore = usePreferencesStoreApi()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const folderStore = useFolderStoreApi()
  const questionStore = useQuestionStoreApi()
  const pending = usePendingAct<SyncSettingsPending>()

  const live = useMemo(() => pendingIn(changes, runner?.tables ?? []), [changes, runner])
  const waiting = useMemo<WaitingRow[]>(() => {
    const counts = pendingByTable(live)
    return (runner?.tables ?? []).flatMap((table) => {
      const count = counts[table]
      if (!count) return []
      const key = runner?.labelKeys[table]
      const label = key
        ? contributed(key)
        : isCoreSyncedTable(table)
          ? t(`sync.tables.${table}`)
          : table
      return [{ table, label, count, openable: isContentCollection(table) }]
    })
  }, [live, runner, contributed, t])

  const opened = pending.act?.kind === 'waiting' ? pending.act : null
  const openedItems = useMemo(
    () => (opened ? waitingItems(live, opened.table, opened.names) : []),
    [live, opened],
  )

  const namesIn = (table: ContentCollection): ReadonlyMap<string, string> => {
    switch (table) {
      case 'decks':
        return namesBy(selectDecks(deckStore.getState()), (deck) => deck.name)
      case 'folders':
        return namesBy(selectFolders(folderStore.getState()), (folder) => folder.name)
      case 'cards':
        return namesBy(selectCards(cardStore.getState()), (card) => card.front)
      case 'questions':
        return namesBy(selectQuestions(questionStore.getState()), (question) => question.prompt)
    }
  }

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
    pending.dismiss()
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
    account: email,
    waiting,
    log,
    autosync,
    sync: () => void runner?.run(),
    setAutosync: (on) => void setPreferences(preferencesStore, { autosync: on }),
    review,
    pending: pending.act,
    openedItems,
    openWaiting: (row) => {
      if (!isContentCollection(row.table)) return
      pending.request({
        kind: 'waiting',
        table: row.table,
        label: row.label,
        names: namesIn(row.table),
      })
    },
    requestRepair: () => pending.request({ kind: 'repair' }),
    dismiss: pending.dismiss,
    repair,
  }
}
