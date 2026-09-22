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

/** What the screen around a card knows about it that the card itself does not carry. */
export interface CardActionContext {
  /** Reviews are recorded for this card, so there is a history to open. */
  hasHistory: boolean
  /** Some other deck exists to move it into. */
  canMove: boolean
}

/**
 * Describes each card action once. Every surface — the row menu, the swipe
 * rails, the card browser — renders from this map, so an action behaves and
 * reads the same wherever the learner reaches it.
 *
 * An action is offered when it can change something about this card. An intent
 * left out drops it from every surface — that is how the browser sheds Select,
 * and how a screen that cannot start a session sheds Study — and so does a
 * `context` that says the action has nothing to work on: no history to open, no
 * other deck to move into, no schedule to forget.
 *
 * The toggles stay on every card, because each has a second reading rather than
 * an inert one: Flag unflags, Freeze thaws, Reverse turns back. So does Grade,
 * which means "set the schedule" on a spaced deck and "set the last outcome" on
 * a Fast one. So does Mark known, which re-masters and re-schedules a card that
 * already reads as known rather than doing nothing.
 */
export function cardActionHandlers(
  card: Card,
  intents: CardActionIntents,
  t: TFunction,
  context: CardActionContext,
): ActionHandlers {
  const handlers: ActionHandlers = {
    edit: { onAction: intents.onEdit },
    flag: {
      onAction: intents.onToggleFlag,
      label: card.flagged ? t('cards.row.unflag') : undefined,
    },
    known: { onAction: intents.onMarkKnown },
    freeze: {
      onAction: intents.onToggleFreeze,
      label: card.frozen ? t('actions.unfreeze') : undefined,
    },
    reverse: {
      onAction: intents.onToggleReverse,
      label: card.reversed ? t('actions.unreverse') : undefined,
    },
    duplicate: { onAction: intents.onDuplicate },
    grade: { onAction: intents.onGrade },
    delete: { onAction: intents.onDelete },
  }
  // Reset clears the schedule, the Fast outcome and the reviews behind them at once, so it is
  // offered while any of the three is there to clear.
  if (card.srs !== undefined || card.fastReview !== undefined || context.hasHistory) {
    handlers.reset = { onAction: intents.onResetSrs }
  }
  if (context.hasHistory) handlers.history = { onAction: intents.onHistory }
  if (context.canMove) handlers.move = { onAction: intents.onMove }
  if (intents.onSelect) handlers.select = { onAction: intents.onSelect }
  if (intents.onStudyFrom) handlers.studyFrom = { onAction: intents.onStudyFrom }
  return handlers
}
