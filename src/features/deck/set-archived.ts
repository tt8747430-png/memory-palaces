import { findEntity, nowIso, subtreeDeckIds } from '@/shared/lib'
import { type Deck, type DeckStore, updateDeck } from '@/entities/deck'
import { requireDeck } from './deck-commands'

export async function setDeckArchived(
  store: DeckStore,
  id: string,
  archived: boolean,
  at: number = Date.now(),
): Promise<Deck> {
  const root = requireDeck(store, id)
  const decks = store.getState().decks
  const now = nowIso(at)
  await Promise.all(
    subtreeDeckIds(decks, id).map((subId) => {
      const deck = findEntity(decks, subId)
      if (!deck || deck.archived === archived) return undefined
      return store.getState().save(updateDeck(deck, { archived }, now))
    }),
  )
  return { ...root, archived }
}
