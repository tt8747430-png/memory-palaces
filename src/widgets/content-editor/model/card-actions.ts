import type { TFunction } from 'i18next'
import type { Card } from '@/entities/card'
import { type ActionId, CARD_ACTIONS } from '@/shared/config/actions'
import type { ActionHandlers } from '@/shared/ui'

/** Everything a single card can be asked to do, wherever the ask comes from. */
export interface CardActionIntents {
  onSelect?: () => void
  onEdit: () => void
  onGrade: () => void
  onStudyFrom?: () => void
  onToggleFlag: () => void
  onMarkKnown: () => void
  onResetSrs: () => void
  onToggleFreeze: () => void
  onToggleReverse: () => void
  onMove: () => void
  onDuplicate: () => void
  onHistory: () => void
  onDelete: () => void
}

/**
 * What the card browser's menu offers: everything but the two its own chrome
 * already owns — Select (there is no list to select in) and Edit (its own
 * header button).
 */
const BROWSER_OMITS: ReadonlySet<ActionId> = new Set<ActionId>(['select', 'edit'])

export const BROWSER_CARD_ACTIONS: readonly ActionId[] = CARD_ACTIONS.filter(
  (id) => !BROWSER_OMITS.has(id),
)

/**
 * Describes each card action once. Every surface — the row menu, the swipe
 * rails, the card browser — renders from this map, so an action behaves and
 * reads the same wherever the learner reaches it.
 *
 * An intent left out drops the action from every surface — that is how the
 * browser sheds Select, and how a screen that cannot start a session sheds
 * Study. Every other action is offered on every deck: Grade means "set the
 * schedule" on a spaced deck and "set the last outcome" on a fast one, so a
 * rail the learner configured never comes up empty.
 */
export function cardActionHandlers(
  card: Card,
  intents: CardActionIntents,
  t: TFunction,
): ActionHandlers {
  const handlers: ActionHandlers = {
    edit: { onAction: intents.onEdit },
    flag: {
      onAction: intents.onToggleFlag,
      label: card.flagged ? t('cards.row.unflag') : undefined,
    },
    known: { onAction: intents.onMarkKnown },
    reset: { onAction: intents.onResetSrs },
    freeze: {
      onAction: intents.onToggleFreeze,
      label: card.frozen ? t('actions.unfreeze') : undefined,
    },
    reverse: {
      onAction: intents.onToggleReverse,
      label: card.reversed ? t('actions.unreverse') : undefined,
    },
    move: { onAction: intents.onMove },
    duplicate: { onAction: intents.onDuplicate },
    history: { onAction: intents.onHistory },
    grade: { onAction: intents.onGrade },
    delete: { onAction: intents.onDelete },
  }
  if (intents.onSelect) handlers.select = { onAction: intents.onSelect }
  if (intents.onStudyFrom) handlers.studyFrom = { onAction: intents.onStudyFrom }
  return handlers
}
