import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { type Deck, type DeckSettings, isSubdeck, useDeck, useDeckStoreApi } from '@/entities/deck'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { type Folder, selectFolders, useFolderStore, useFolderStoreApi } from '@/entities/folder'
import type { Card } from '@/entities/card'
import { useHistoryStoreApi } from '@/entities/learning-history'
import {
  archiveDecks,
  deleteDeck,
  duplicateDeck,
  moveDecks,
  restoreDecks,
  useDeleteDeckDeps,
} from '@/features/deck'
import { resetDeckSrs } from '@/features/card'
import { exportCardsAnki, exportCardsCsv } from '@/features/content'
import { type MoveDestination, placeOfDestination } from '@/widgets/deck-tree'
import { useImportFile } from '@/widgets/content-editor'
import { cardsInSubtree, subtreeDeckIds, useOneOpen, usePendingAct } from '@/shared/lib'

export type DeckSettingsSheet = 'appearance' | 'move' | 'export' | 'import'

export type DeckSettingsConfirm = 'duplicate' | 'archive' | 'reset' | 'delete'

export interface DeckSettingsNav {
  onBack?: () => void
  onDeleted?: () => void
  onArchived?: () => void
  onPasteNotes?: () => void
  onReviewImport?: () => void
  onExtensionImport?: (to: string) => void
  onOpenAlgorithm?: () => void
  onOpenCardStyle?: () => void
  onOpenTts?: () => void
}

export interface DeckSettingsModel {
  ready: boolean
  deck: Deck | undefined
  decks: Deck[]
  folders: Folder[]
  settings: DeckSettings
  cards: Card[]
  moveExcludeIds: ReadonlySet<string>
  archiving: boolean
  algorithmLocked: boolean
  sheet: DeckSettingsSheet | null
  open: (sheet: DeckSettingsSheet) => void
  onSheetOpenChange: (sheet: DeckSettingsSheet) => (open: boolean) => void
  confirming: DeckSettingsConfirm | null
  ask: (confirm: DeckSettingsConfirm) => void
  confirm: () => void
  onConfirmOpenChange: (confirm: DeckSettingsConfirm) => (open: boolean) => void
  act: {
    duplicate: () => void
    toggleArchived: () => void
    reset: () => void
    remove: () => void
    exportCsv: () => void
    exportAnki: () => void
    move: (destination: MoveDestination) => void
    importFile: (file: File) => void
    pasteNotes: () => void
  }
}

export function useDeckSettings(deckId: string, nav: DeckSettingsNav): DeckSettingsModel {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const folderStore = useFolderStoreApi()
  const historyStore = useHistoryStoreApi()
  const deleteDeps = useDeleteDeckDeps()
  const importFile = useImportFile()

  const { decks, deck, settings, ready } = useDeck(deckId)
  const folders = useFolderStore(selectFolders)
  const allCards = useCardStore(selectCards)
  const cards = useMemo(() => cardsInSubtree(decks, allCards, deckId), [decks, allCards, deckId])
  const moveExcludeIds = useMemo(() => new Set(subtreeDeckIds(decks, deckId)), [decks, deckId])

  const sheet = useOneOpen<DeckSettingsSheet>()
  const pending = usePendingAct<DeckSettingsConfirm>()

  const archiving = !deck?.archived

  const toggleArchived = () => {
    if (archiving) void archiveDecks(deckStore, [deckId])
    else void restoreDecks(deckStore, folderStore, [{ id: deckId }])
    toast.success(archiving ? t('deckSettings.toast.archived') : t('deckSettings.toast.unarchived'))
    if (archiving) nav.onArchived?.()
  }

  const exportWith = (run: () => void) => {
    sheet.close()
    run()
    toast.success(t('deckSettings.toast.exported'))
  }

  const act: DeckSettingsModel['act'] = {
    duplicate: () => {
      void duplicateDeck(deckStore, cardStore, deckId)
      toast.success(t('deckSettings.toast.duplicated'))
    },
    toggleArchived,
    reset: () => {
      void resetDeckSrs(deckStore, cardStore, historyStore, deckId)
      toast.success(t('deckSettings.toast.reset'))
    },
    remove: () => {
      void deleteDeck(deleteDeps, deckId)
      nav.onDeleted?.()
    },
    exportCsv: () => exportWith(() => exportCardsCsv(deck?.name ?? '', cards)),
    exportAnki: () => exportWith(() => exportCardsAnki(deck?.name ?? '', cards)),
    move: (destination) => {
      sheet.close()
      const place = placeOfDestination(destination)
      if (place === null) {
        if (archiving) pending.request('archive')
        return
      }
      void moveDecks(deckStore, [{ id: deckId, to: place }])
    },
    importFile: (file) => {
      sheet.close()
      void importFile(file, () => nav.onReviewImport?.())
    },
    pasteNotes: () => {
      sheet.close()
      nav.onPasteNotes?.()
    },
  }

  const confirmed: Record<DeckSettingsConfirm, () => void> = {
    duplicate: act.duplicate,
    archive: act.toggleArchived,
    reset: act.reset,
    delete: act.remove,
  }

  return {
    ready,
    deck,
    decks,
    folders,
    settings,
    cards,
    moveExcludeIds,
    archiving,
    algorithmLocked: deck !== undefined && isSubdeck(deck),
    sheet: sheet.current,
    open: sheet.open,
    onSheetOpenChange: sheet.onOpenChange,
    confirming: pending.act,
    ask: pending.request,
    confirm: () => pending.resolve((kind) => confirmed[kind]()),
    onConfirmOpenChange: pending.onOpenChange,
    act,
  }
}
