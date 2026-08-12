import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Card } from '@/entities/card'
import { useCardStoreApi } from '@/entities/card'
import {
  deleteCard,
  duplicateCard,
  markCardsKnown,
  moveCards,
  resetCardsSrs,
  restoreCardPlacements,
  toggleCardFlag,
} from '@/features/card'
import type { MultiSelect } from '@/shared/lib'
import { bulkAction, type SelectActionHandlers } from '@/shared/ui'

export interface CardCommands {
  duplicate: (id: string) => void
  toggleFlag: (id: string) => void
  markKnown: (id: string) => void
  resetSrs: (id: string) => void
  moveTo: (ids: readonly string[], deckId: string, deckName: string) => void
  remove: (id: string) => void
  removeSelected: () => void
  selectHandlers: SelectActionHandlers
}

export function useCardCommands(
  cards: Card[],
  selection: MultiSelect,
  onRequestBulkDelete: () => void,
  onRequestMove: (ids: string[]) => void,
): CardCommands {
  const { t } = useTranslation()
  const store = useCardStoreApi()
  const { ids, exit } = selection
  const empty = ids.size === 0

  const duplicate = (id: string) => {
    void duplicateCard(store, id)
    toast.success(t('cards.row.duplicated'))
  }
  const markKnown = (id: string) => {
    void markCardsKnown(store, [id])
    toast.success(t('cards.row.markedKnown'))
  }
  const resetSrs = (id: string) => {
    void resetCardsSrs(store, [id])
    toast.success(t('cards.row.scheduleReset'))
  }

  /**
   * The one way cards change decks, whichever surface asked — row menu, swipe or the select
   * toolbar. A move that lands nowhere new says nothing; anything else can be undone from the
   * toast, which puts every card back in the deck and at the order it left.
   */
  const moveTo = (batch: readonly string[], deckId: string, deckName: string) => {
    void (async () => {
      const previous = await moveCards(store, batch, deckId)
      if (previous.length === 0) return
      const message =
        previous.length === 1
          ? t('cards.move.movedOne', { name: deckName })
          : t('cards.move.movedMany', { count: previous.length, name: deckName })
      toast.success(message, {
        action: {
          label: t('common.undo'),
          onClick: () => void restoreCardPlacements(store, previous),
        },
      })
    })()
    if (selection.active) exit()
  }

  const selectHandlers: SelectActionHandlers = {
    move: { disabled: empty, onAction: () => onRequestMove([...ids]) },
    flag: bulkAction(selection, (batch) => {
      const selected = new Set(batch)
      const toFlag = cards.filter((card) => selected.has(card.id) && !card.flagged)
      toFlag.forEach((card) => void toggleCardFlag(store, card.id))
      toast.success(t('cards.bulk.flagged', { count: toFlag.length }))
    }),
    known: bulkAction(selection, (batch) => {
      void markCardsKnown(store, batch)
      toast.success(t('cards.row.markedKnown'))
    }),
    reset: bulkAction(selection, (batch) => {
      void resetCardsSrs(store, batch)
      toast.success(t('cards.row.scheduleReset'))
    }),
    duplicate: bulkAction(selection, (batch) => {
      void Promise.all(batch.map((id) => duplicateCard(store, id)))
      toast.success(t('cards.bulk.duplicated', { count: batch.length }))
    }),
    delete: { disabled: empty, onAction: onRequestBulkDelete },
  }

  return {
    duplicate,
    toggleFlag: (id) => void toggleCardFlag(store, id),
    markKnown,
    resetSrs,
    moveTo,
    remove: (id) => {
      void deleteCard(store, id)
      toast.success(t('cards.transfer.deleted'))
    },
    removeSelected: () => {
      const batch = [...ids]
      void Promise.all(batch.map((id) => deleteCard(store, id)))
      toast.success(t('cards.transfer.deletedMany', { count: batch.length }))
      exit()
    },
    selectHandlers,
  }
}
