import { type Deck, type DeckSettings, type DeckStore } from '@/entities/deck'
import { editDeck } from './deck-commands'

/**
 * Patch a deck's settings without disturbing the rest of them. Every settings surface writes
 * through here, so none of them has to remember that `settings` is a partial override merged over
 * the inherited defaults — spreading the wrong base is how a deck loses a setting it never touched.
 */
export async function updateDeckSettings(
  store: DeckStore,
  deckId: string,
  patch: Partial<DeckSettings>,
): Promise<Deck> {
  const current = store.getState().decks.find((deck) => deck.id === deckId)
  if (!current) throw new Error(`Deck not found: ${deckId}`)
  return editDeck(store, deckId, { settings: { ...current.settings, ...patch } })
}
