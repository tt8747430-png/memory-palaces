import { subtreeDeckIds } from '@app/shared/domain'
import { updateDeck } from '@app/decks/model/deck'
import type { DeckStore } from '@app/decks/data/stores'

/**
 * Archive (or restore) a selection of decks.
 *
 * Archiving applies to each deck's whole subtree, so subdecks travel with their
 * parent instead of being orphaned. The subtrees are unioned before writing, so
 * selecting both a parent and its child touches the child once, not twice.
 */
export async function setDecksArchived(
  store: DeckStore,
  ids: readonly string[],
  archived: boolean,
): Promise<void> {
  const decks = store.decks()
  const targets = new Set<string>()
  for (const id of ids) for (const subId of subtreeDeckIds(decks, id)) targets.add(subId)
  const now = new Date().toISOString()
  await Promise.all(
    decks
      .filter((deck) => targets.has(deck.id) && deck.archived !== archived)
      .map((deck) => store.save(updateDeck(deck, { archived }, now))),
  )
}
