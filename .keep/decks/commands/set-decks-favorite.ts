import { updateDeck } from '@app/decks/model/deck'
import type { DeckStore } from '@app/decks/data/stores'

/**
 * Favourite a selection of decks.
 *
 * Favourite is a set, not a flip: a mixed selection favourites everything, and
 * only an all-favourited selection clears — so the action always has one
 * meaning regardless of what was picked. Returns the value applied, so the
 * caller can report what happened without re-deriving the rule.
 */
export async function setDecksFavorite(store: DeckStore, ids: readonly string[]): Promise<boolean> {
  const targets = new Set(ids)
  const decks = store.decks().filter((deck) => targets.has(deck.id))
  const allFavorited = decks.length > 0 && decks.every((deck) => deck.favorite)
  const favorite = !allFavorited
  const now = new Date().toISOString()
  await Promise.all(
    decks
      .filter((deck) => Boolean(deck.favorite) !== favorite)
      .map((deck) => store.save(updateDeck(deck, { favorite }, now))),
  )
  return favorite
}
