import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { type Deck, type DeckSettings, useDeck, useDeckStoreApi } from '@/entities/deck'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { type Folder, selectFolders, useFolderStore } from '@/entities/folder'
import type { Card } from '@/entities/card'
import { deleteDeck, duplicateDeck, moveDeck, setDeckArchived } from '@/features/deck'
import { resetDeckSrs } from '@/features/card'
import { exportCardsAnki, exportCardsCsv } from '@/features/content'
import type { MoveDestination } from '@/widgets/deck-tree'
import { useImportFile } from '@/widgets/content-editor'
import { cardsInSubtree, subtreeDeckIds, usePendingAct } from '@/shared/lib'

/** One open sheet at a time — a flag each makes "export over move" a reachable state. */
export type DeckSettingsSheet = 'appearance' | 'move' | 'export' | 'import'

/** And one pending confirmation, for the same reason (CODE_STYLE §3a). */
export type DeckSettingsConfirm = 'duplicate' | 'archive' | 'reset' | 'delete'

/** What each confirmation runs once the learner says yes — the acts that take no argument. */
type ConfirmableAct = 'duplicate' | 'toggleArchived' | 'reset' | 'remove'

const RUN: Record<DeckSettingsConfirm, ConfirmableAct> = {
  duplicate: 'duplicate',
  archive: 'toggleArchived',
  reset: 'reset',
  delete: 'remove',
}

/** Every way this screen hands control back to the router. */
export interface DeckSettingsNav {
  onBack?: () => void
  onDeleted?: () => void
  onArchived?: () => void
  onPasteNotes?: () => void
  onReviewImport?: () => void
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
  /** A deck cannot be moved inside its own subtree, so every deck under it is off the table. */
  moveExcludeIds: ReadonlySet<string>
  /** Whether the archive row would archive (rather than restore) the deck. */
  archiving: boolean
  sheet: DeckSettingsSheet | null
  open: (sheet: DeckSettingsSheet) => void
  /** `onOpenChange` for the open sheet — it closes on dismissal and ignores the rest. */
  onSheetOpenChange: (open: boolean) => void
  confirming: DeckSettingsConfirm | null
  ask: (confirm: DeckSettingsConfirm) => void
  /** Runs the pending act — through `usePendingAct`, so a double-tapped confirm runs it once. */
  confirm: () => void
  /** `onOpenChange` for one dialog: it may only dismiss the confirmation it belongs to. */
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

/**
 * Everything the deck settings screen reads and every act it offers, behind one interface — the
 * page below it is markup. Which store a write lands in, and the fact that archiving from the move
 * sheet is the same act as archiving from its own row, stay in here.
 */
export function useDeckSettings(deckId: string, nav: DeckSettingsNav): DeckSettingsModel {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const importFile = useImportFile()

  const { decks, deck, settings, ready } = useDeck(deckId)
  const folders = useFolderStore(selectFolders)
  const allCards = useCardStore(selectCards)
  const cards = useMemo(() => cardsInSubtree(decks, allCards, deckId), [decks, allCards, deckId])
  const moveExcludeIds = useMemo(() => new Set(subtreeDeckIds(decks, deckId)), [decks, deckId])

  const [sheet, setSheet] = useState<DeckSettingsSheet | null>(null)
  const pending = usePendingAct<DeckSettingsConfirm>()

  const archiving = !deck?.archived

  const toggleArchived = () => {
    void setDeckArchived(deckStore, deckId, archiving)
    toast.success(archiving ? t('deckSettings.toast.archived') : t('deckSettings.toast.unarchived'))
    // An archived deck is gone from the library it was reached through, so its settings screen has
    // nothing left to describe. Restoring one leaves you where you are.
    if (archiving) nav.onArchived?.()
  }

  const exportWith = (run: () => void) => {
    setSheet(null)
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
      void resetDeckSrs(deckStore, cardStore, deckId)
      toast.success(t('deckSettings.toast.reset'))
    },
    remove: () => {
      void deleteDeck(deckStore, cardStore, deckId)
      nav.onDeleted?.()
    },
    exportCsv: () => exportWith(() => exportCardsCsv(deck?.name ?? '', cards)),
    exportAnki: () => exportWith(() => exportCardsAnki(deck?.name ?? '', cards)),
    move: (destination) => {
      setSheet(null)
      // "Move to archive" is the archive act, so it asks the same question the row asks rather
      // than archiving behind the learner's back.
      if (destination.kind === 'archive') {
        pending.request('archive')
        return
      }
      const parentId = destination.kind === 'deck' ? destination.deckId : null
      const folderId = destination.kind === 'folder' ? destination.folderId : null
      void moveDeck(deckStore, deckId, parentId, folderId)
    },
    importFile: (file) => {
      setSheet(null)
      void importFile(file, () => nav.onReviewImport?.())
    },
    pasteNotes: () => {
      setSheet(null)
      nav.onPasteNotes?.()
    },
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
    sheet,
    open: setSheet,
    onSheetOpenChange: (open) => {
      if (!open) setSheet(null)
    },
    confirming: pending.act,
    ask: pending.request,
    confirm: () => pending.resolve((kind) => act[RUN[kind]]()),
    onConfirmOpenChange: (kind) => (open) => {
      if (!open && pending.act === kind) pending.dismiss()
    },
    act,
  }
}
