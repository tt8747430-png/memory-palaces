import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Card } from '@/entities/card'
import { useCardStoreApi } from '@/entities/card'
import {
  deleteCard,
  duplicateCard,
  markCardsKnown,
  resetCardsSrs,
  toggleCardFlag,
} from '@/features/card'
import type { MultiSelect } from '@/shared/lib'
import type { SelectActionHandlers } from '@/shared/ui'

export interface CardCommands {
  duplicate: (id: string) => void
  toggleFlag: (id: string) => void
  markKnown: (id: string) => void
  resetSrs: (id: string) => void
  remove: (id: string) => void
  removeSelected: () => void
  /** The learner's configured select toolbar, wired to what a card selection can do. */
  selectHandlers: SelectActionHandlers
}

/**
 * Every write the card list can make, each with the confirmation it owes the learner. Kept out
 * of the list so the list is only ever deciding what to draw.
 */
export function useCardCommands(
  cards: Card[],
  selection: MultiSelect,
  /** Deleting is confirmed first, and the confirmation belongs to the list. */
  onRequestBulkDelete: () => void,
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

  const selectHandlers: SelectActionHandlers = {
    flag: {
      disabled: empty,
      onAction: () => {
        const toFlag = cards.filter((card) => ids.has(card.id) && !card.flagged)
        toFlag.forEach((card) => void toggleCardFlag(store, card.id))
        toast.success(t('cards.bulk.flagged', { count: toFlag.length }))
        exit()
      },
    },
    known: {
      disabled: empty,
      onAction: () => {
        void markCardsKnown(store, [...ids])
        toast.success(t('cards.row.markedKnown'))
        exit()
      },
    },
    reset: {
      disabled: empty,
      onAction: () => {
        void resetCardsSrs(store, [...ids])
        toast.success(t('cards.row.scheduleReset'))
        exit()
      },
    },
    duplicate: {
      disabled: empty,
      onAction: () => {
        const batch = [...ids]
        void Promise.all(batch.map((id) => duplicateCard(store, id)))
        toast.success(t('cards.bulk.duplicated', { count: batch.length }))
        exit()
      },
    },
    delete: { disabled: empty, onAction: onRequestBulkDelete },
  }

  return {
    duplicate,
    toggleFlag: (id) => void toggleCardFlag(store, id),
    markKnown,
    resetSrs,
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
