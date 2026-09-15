import { useTranslation } from 'react-i18next'
import type { Card } from '@/entities/card'
import type { ActionHandlers } from '@/shared/ui'
import type { MultiSelect } from '@/shared/lib'
import { cardActionHandlers } from './card-actions'
import type { CardCommands } from './use-card-commands'

/** The surfaces a card action can raise, each owned by the screen around it. */
export interface CardSurfaces {
  move: (ids: readonly string[]) => void
  progress: (id: string) => void
  history: (id: string) => void
  confirmDelete: (id: string) => void
}

interface Args {
  commands: CardCommands
  selection: MultiSelect
  surfaces: CardSurfaces
  onEditCard: (cardId: string) => void
  onStudyFrom?: (cardId: string) => void
}

/**
 * Builds a card's action catalog. `close` lets a surface stand down before an
 * action raises one of its own — the browser closes rather than stacking a
 * drawer over a fullscreen dialog.
 */
export function useCardActions({
  commands,
  selection,
  surfaces,
  onEditCard,
  onStudyFrom,
}: Args): (card: Card, close?: () => void) => ActionHandlers {
  const { t } = useTranslation()

  return (card, close = () => {}) =>
    cardActionHandlers(
      card,
      {
        onSelect: () => selection.begin(card.id),
        onEdit: () => {
          close()
          onEditCard(card.id)
        },
        onGrade: () => {
          close()
          surfaces.progress(card.id)
        },
        onStudyFrom: onStudyFrom
          ? () => {
              close()
              onStudyFrom(card.id)
            }
          : undefined,
        onToggleFlag: () => commands.toggleFlag(card.id),
        onMarkKnown: () => commands.markKnown(card.id),
        onResetSrs: () => commands.resetSrs(card.id),
        onToggleFreeze: () => commands.toggleFreeze(card),
        onToggleReverse: () => commands.toggleReverse(card),
        onMove: () => {
          close()
          surfaces.move([card.id])
        },
        onDuplicate: () => commands.duplicate(card.id),
        onHistory: () => {
          close()
          surfaces.history(card.id)
        },
        onDelete: () => {
          close()
          surfaces.confirmDelete(card.id)
        },
      },
      t,
    )
}
