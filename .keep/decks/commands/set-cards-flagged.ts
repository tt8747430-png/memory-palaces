import { updateCard } from '@app/decks/model/card'
import type { CardStore } from '@app/decks/data/stores'

/**
 * Flag (or unflag) a selection of cards.
 *
 * A set, not a flip — the action means the same thing whatever the selection
 * held. Returns how many cards actually changed, so the caller can report an
 * honest count rather than the selection size.
 */
export async function setCardsFlagged(
  store: CardStore,
  ids: readonly string[],
  flagged: boolean,
): Promise<number> {
  const targets = new Set(ids)
  const changing = store
    .cards()
    .filter((card) => targets.has(card.id) && Boolean(card.flagged) !== flagged)
  const now = new Date().toISOString()
  await Promise.all(changing.map((card) => store.save(updateCard(card, { flagged }, now))))
  return changing.length
}
