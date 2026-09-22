import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Card } from '@/entities/card'
import { selectHistory, useHistoryStore } from '@/entities/learning-history'
import type { ActionHandlers } from '@/shared/ui'
import { type MultiSelect, useStableHandlers } from '@/shared/lib'
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
  /** Some other deck exists to move a card into, so Move has a destination to offer. */
  canMove: boolean
}

export type CardActionsFor = (card: Card, close?: () => void) => ActionHandlers

const stayOpen = () => {}

/**
 * Builds a card's action catalog. `close` lets a surface stand down before an
 * action raises one of its own — the browser closes rather than stacking a
 * drawer over a fullscreen dialog.
 *
 * The builder keeps its identity until what it *offers* changes — which cards have history, whether
 * there is anywhere to move to, whether studying from a card is possible — because every row builds
 * its catalog from it and is memoized on it. What an action *does* goes through `useStableHandlers`,
 * read when it is pressed, so a new render of the list never invalidates a row.
 */
export function useCardActions({
  commands,
  selection,
  surfaces,
  onEditCard,
  onStudyFrom,
  canMove,
}: Args): CardActionsFor {
  const { t } = useTranslation()
  const entries = useHistoryStore(selectHistory)
  // Which cards have a review behind them, asked once for the whole list rather than per row:
  // every visible row builds its own catalogue, and a scan each would be quadratic.
  const reviewed = useMemo(() => new Set(entries.map((entry) => entry.cardId)), [entries])
  // What an action does is read when it is pressed; only what the catalog offers is a dependency.
  const act = useStableHandlers({
    select: selection.begin,
    edit: onEditCard,
    studyFrom: onStudyFrom,
    progress: surfaces.progress,
    move: surfaces.move,
    history: surfaces.history,
    confirmDelete: surfaces.confirmDelete,
    toggleFlag: commands.toggleFlag,
    markKnown: commands.markKnown,
    resetSrs: commands.resetSrs,
    toggleFreeze: commands.toggleFreeze,
    toggleReverse: commands.toggleReverse,
    duplicate: commands.duplicate,
  })

  return useCallback(
    (card, close = stayOpen) => {
      const closing = (then: () => void) => () => {
        close()
        then()
      }
      const studyFrom = act.studyFrom
      return cardActionHandlers(
        card,
        {
          onSelect: () => act.select(card.id),
          onEdit: closing(() => act.edit(card.id)),
          onGrade: closing(() => act.progress(card.id)),
          onStudyFrom: studyFrom ? closing(() => studyFrom(card.id)) : undefined,
          onToggleFlag: () => act.toggleFlag(card.id),
          onMarkKnown: () => act.markKnown(card.id),
          onResetSrs: () => act.resetSrs(card.id),
          onToggleFreeze: () => act.toggleFreeze(card),
          onToggleReverse: () => act.toggleReverse(card),
          onMove: closing(() => act.move([card.id])),
          onDuplicate: () => act.duplicate(card.id),
          onHistory: closing(() => act.history(card.id)),
          onDelete: closing(() => act.confirmDelete(card.id)),
        },
        t,
        { hasHistory: reviewed.has(card.id), canMove },
      )
    },
    [act, t, reviewed, canMove],
  )
}
