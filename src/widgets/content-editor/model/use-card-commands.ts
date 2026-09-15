import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Card } from '@/entities/card'
import { useCardStoreApi } from '@/entities/card'
import { useHistoryStoreApi } from '@/entities/learning-history'
import {
  deleteCard,
  duplicateCard,
  markCardsKnown,
  moveCards,
  resetCardsSrs,
  restoreCardPlacements,
  setCardProgress,
  toggleCardFlag,
  toggleCardFrozen,
  toggleCardReversed,
} from '@/features/card'
import { answerCard } from '@/features/review'
import type { MultiSelect } from '@/shared/lib'
import type { CardProgressChange } from './card-progress-change'
import { bulkAction, type SelectActionHandlers } from '@/shared/ui'

export interface CardCommands {
  duplicate: (id: string) => void
  toggleFlag: (id: string) => void
  markKnown: (id: string) => void
  resetSrs: (id: string) => void
  toggleFreeze: (card: Card) => void
  toggleReverse: (card: Card) => void
  setProgress: (id: string, change: CardProgressChange) => void
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
  const history = useHistoryStoreApi()
  const { ids, exit } = selection
  const empty = ids.size === 0

  const duplicate = (id: string) => {
    void duplicateCard(store, id)
    toast.success(t('cards.row.duplicated'))
  }
  const markKnown = (id: string) => {
    void markCardsKnown(store, history, [id])
    toast.success(t('cards.row.markedKnown'))
  }
  const resetSrs = (id: string) => {
    void resetCardsSrs(store, history, [id])
    toast.success(t('cards.row.scheduleReset'))
  }
  const toggleFreeze = (card: Card) => {
    void toggleCardFrozen(store, card.id)
    toast.success(card.frozen ? t('cardActions.unfrozeToast') : t('cardActions.frozeToast'))
  }
  const toggleReverse = (card: Card) => {
    void toggleCardReversed(store, card.id)
    toast.success(card.reversed ? t('cardActions.unreversedToast') : t('cardActions.reversedToast'))
  }
  const setProgress = (id: string, change: CardProgressChange) => {
    if (change.kind === 'fastReview') void answerCard(store, history, id, change.outcome)
    else void setCardProgress(store, history, id, { srs: change.srs, grade: change.grade })
    toast.success(t('cardProgress.applied'))
  }

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
      void markCardsKnown(store, history, batch)
      toast.success(t('cards.row.markedKnown'))
    }),
    reset: bulkAction(selection, (batch) => {
      void resetCardsSrs(store, history, batch)
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
    toggleFreeze,
    toggleReverse,
    setProgress,
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
