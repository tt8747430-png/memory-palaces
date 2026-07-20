import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  type Card,
  deleteCard,
  deleteCards,
  duplicateCard,
  duplicateCards,
  markCardsKnown,
  reorderCards,
  resetCardsSrs,
  setCardsFlagged,
  toggleCardFlag,
} from '@/decks'
import { readAnkiFile } from '@/import'
import type { ContentSort } from '@/settings'
import {
  cardMaturityCounts,
  cardsInSubtree,
  ContentImportError,
  type SrsStatus,
  srsStatus,
} from '@/shared/domain'
import { orderPatch, useOptimisticPatch } from '@/shared/lib'
import { openConfirmDialog, type SelectActionHandlers } from '@/shared/ui'
import { useStore } from '@/shared/data/use-store'
import { useServices } from '@/shell/services-provider'
import { type CardFilter, openCardFilterDrawer } from './card-filter-drawer'
import { openImportChooserDrawer } from './import-chooser-drawer'

const EMPTY_FILTER: CardFilter = { maturity: new Set<SrsStatus>(), flaggedOnly: false }

const dueKey = (card: Card) => card.srs?.due ?? ''

/**
 * `main` leans on the card store emitting rows already ordered, so its `manual` case is a
 * pass-through. Ours cannot: `useOptimisticPatch` rewrites `order` in place while leaving the
 * array in the store's *previous* order, so a just-dropped row would render at its old index
 * for a beat — the drop flicker CODE_STYLE.md §10 is about. Sorting by `order` here is what
 * makes the optimistic patch visible.
 */
function sortCards(cards: Card[], sort: ContentSort): Card[] {
  switch (sort) {
    case 'name':
      return [...cards].sort((a, b) => a.front.localeCompare(b.front))
    case 'recent':
      return [...cards].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'due':
      return [...cards].sort((a, b) => dueKey(a).localeCompare(dueKey(b)))
    case 'flagged':
      return [...cards].sort((a, b) => Number(b.flagged) - Number(a.flagged))
    case 'manual':
      return [...cards].sort((a, b) => a.order - b.order)
  }
}

export interface UseDeckContentOptions {
  deckId: string
  selectMode: boolean
  onSelectModeChange: (on: boolean) => void
  sort: ContentSort
  onSortChange: (sort: ContentSort) => void
  searchQuery?: string
  onPasteNotes: () => void
  onReviewImport: () => void
}

/**
 * `DeckContentEditor`'s ViewModel. Earned (A.7): it owns the derived card read model
 * (subtree → sort → search → filter), the optimistic reorder, multi-select with its bulk
 * commands, and the promise-sequenced overlay flows. `main` drove all of this from ten
 * `useState`s inside the component; six of them are gone here because the overlays this repo
 * ported are promise-returning — `filterOpen`/`draftMaturity`/`draftFlagged` moved into
 * `openCardFilterDrawer`, `importOpen` into `openImportChooserDrawer`, and
 * `pendingDeleteId`/`bulkDeleteOpen` into `openConfirmDialog`. What is left is genuine view
 * state: the selection, the applied filter, and which card the browser is showing.
 */
export function useDeckContent({
  deckId,
  selectMode,
  onSelectModeChange,
  sort,
  onSortChange,
  searchQuery,
  onPasteNotes,
  onReviewImport,
}: UseDeckContentOptions) {
  const { t } = useTranslation()
  const { cardStore, deckStore, preferencesStore, importDraftStore } = useServices()

  const storeCards = useStore(cardStore.cards)
  const decks = useStore(deckStore.decks)
  const prefs = useStore(preferencesStore.effective)

  // A drop shows up instantly and stays put: the new order is held over the store's
  // emissions until the persisted rows agree with it.
  const [allCards, patchCards] = useOptimisticPatch(storeCards)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<CardFilter>(EMPTY_FILTER)
  const [browserCardId, setBrowserCardId] = useState<string | null>(null)

  const cards = useMemo(() => cardsInSubtree(decks, allCards, deckId), [decks, allCards, deckId])
  const maturity = useMemo(() => cardMaturityCounts(cards), [cards])
  const sortedCards = useMemo(() => sortCards(cards, sort), [cards, sort])

  const needle = (searchQuery ?? '').trim().toLowerCase()
  const visibleCards = useMemo(() => {
    let list = sortedCards
    if (needle)
      list = list.filter((card) =>
        [card.front, card.back, card.hint, card.tip]
          .filter((field): field is string => Boolean(field))
          .some((field) => field.toLowerCase().includes(needle)),
      )
    if (filter.maturity.size > 0)
      list = list.filter((card) => filter.maturity.has(srsStatus(card.srs)))
    if (filter.flaggedOnly) list = list.filter((card) => card.flagged)
    return list
  }, [sortedCards, needle, filter])

  const total = cards.length
  const selectedCount = selectedIds.size
  const noSelection = selectedCount === 0
  const allVisibleSelected =
    visibleCards.length > 0 && visibleCards.every((card) => selectedIds.has(card.id))
  const filterCount = filter.maturity.size + (filter.flaggedOnly ? 1 : 0)

  // Reordering is only offered when the list on screen is the whole, unsearched list —
  // dragging row 2 above row 5 of a *filtered* list would mean nothing to persist.
  const reorderable = selectMode && !needle

  const exitSelect = () => {
    onSelectModeChange(false)
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const requestSelect = (id: string) => {
    onSelectModeChange(true)
    setSelectedIds((prev) => new Set(prev).add(id))
  }

  const toggleSelectAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) visibleCards.forEach((card) => next.delete(card.id))
      else visibleCards.forEach((card) => next.add(card.id))
      return next
    })

  const onReorder = (orderedIds: string[]) => {
    patchCards(orderPatch<Card>(orderedIds))
    void reorderCards(cardStore, orderedIds)
    // A manual drag *is* a statement about order; any other sort would discard it on the
    // next render, so the list switches to manual to keep what the learner just did.
    if (sort !== 'manual') onSortChange('manual')
  }

  /** Confirms, then deletes the whole selection in one command — never a loop over `deleteCard`. */
  const deleteSelected = async () => {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    const confirmed = await openConfirmDialog({
      tone: 'danger',
      title: t('cards.delete.bulkTitle', { count: ids.length }),
      description: t('cards.delete.body'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    })
    if (!confirmed) return
    await deleteCards(cardStore, ids)
    toast.success(t('cards.transfer.deletedMany', { count: ids.length }))
    exitSelect()
  }

  const deleteOne = async (id: string) => {
    const confirmed = await openConfirmDialog({
      tone: 'danger',
      title: t('cards.delete.cardTitle'),
      description: t('cards.delete.body'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    })
    if (!confirmed) return
    await deleteCard(cardStore, id)
    toast.success(t('cards.transfer.deleted'))
  }

  const duplicateOne = async (id: string) => {
    await duplicateCard(cardStore, id)
    toast.success(t('cards.row.duplicated'))
  }

  const markKnownOne = async (id: string) => {
    await markCardsKnown(cardStore, [id])
    toast.success(t('cards.row.markedKnown'))
  }

  const resetSrsOne = async (id: string) => {
    await resetCardsSrs(cardStore, [id])
    toast.success(t('cards.row.scheduleReset'))
  }

  const toggleFlagOne = (id: string) => void toggleCardFlag(cardStore, id)

  const applyFilter = (next: CardFilter) => setFilter(next)

  const openFilter = async () => {
    const next = await openCardFilterDrawer({ filter, counts: maturity })
    if (next) applyFilter(next)
  }

  const clearFilter = () => setFilter(EMPTY_FILTER)

  const importAnkiFile = async (file: File) => {
    try {
      const data = await readAnkiFile(file)
      if (data.cards.length === 0) {
        toast.error(t('cards.transfer.noCardsFound'))
        return
      }
      importDraftStore.setDraft('anki', data.cards)
      onReviewImport()
    } catch (error) {
      toast.error(
        error instanceof ContentImportError ? error.message : t('cards.transfer.importFailed'),
      )
    }
  }

  /** Resolves the accept string when the learner picked the file route, else `null`. */
  const chooseImport = async (): Promise<string | null> => {
    const choice = await openImportChooserDrawer()
    if (choice === 'paste') {
      onPasteNotes()
      return null
    }
    return choice === 'anki' ? '.csv,.tsv,.txt' : null
  }

  // The bar the learner configured (Settings → Select toolbar) for cards. Each entry is a
  // bulk command, never a loop over a single-card one.
  const selectHandlers: SelectActionHandlers = {
    flag: {
      disabled: noSelection,
      onAction: () => {
        const ids = [...selectedIds]
        void setCardsFlagged(cardStore, ids, true)
        toast.success(t('cards.bulk.flagged', { count: ids.length }))
        exitSelect()
      },
    },
    known: {
      disabled: noSelection,
      onAction: () => {
        void markCardsKnown(cardStore, [...selectedIds])
        toast.success(t('cards.row.markedKnown'))
        exitSelect()
      },
    },
    reset: {
      disabled: noSelection,
      onAction: () => {
        void resetCardsSrs(cardStore, [...selectedIds])
        toast.success(t('cards.row.scheduleReset'))
        exitSelect()
      },
    },
    duplicate: {
      disabled: noSelection,
      onAction: () => {
        const ids = [...selectedIds]
        void duplicateCards(cardStore, ids)
        toast.success(t('cards.bulk.duplicated', { count: ids.length }))
        exitSelect()
      },
    },
    delete: { disabled: noSelection, onAction: () => void deleteSelected() },
  }

  return {
    cards,
    sortedCards,
    visibleCards,
    maturity,
    total,
    selectedIds,
    selectedCount,
    allVisibleSelected,
    reorderable,
    filterCount,
    swipe: prefs.swipe.card,
    selectToolbarActions: prefs.selectToolbar.card,
    selectHandlers,
    browserCardId,
    toggleSelect,
    requestSelect,
    toggleSelectAll,
    exitSelect,
    onReorder,
    openFilter,
    applyFilter,
    clearFilter,
    deleteSelected,
    openBrowser: setBrowserCardId,
    closeBrowser: () => setBrowserCardId(null),
    chooseImport,
    importAnkiFile,
    deleteOne,
    duplicateOne,
    markKnownOne,
    resetSrsOne,
    toggleFlagOne,
  }
}

export type DeckContentVm = ReturnType<typeof useDeckContent>
