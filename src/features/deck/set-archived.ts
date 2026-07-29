import { findEntity, nowIso, subtreeDeckIds } from '@/shared/lib'
import { type Deck, type DeckStore, updateDeck } from '@/entities/deck'
import { requireDeck } from './require-deck'

export async function setDeckArchived(
  store: DeckStore,
  id: string,
  archived: boolean,
): Promise<Deck> {
  const root = requireDeck(store, id)
  const decks = store.getState().decks
  const now = nowIso()
  await Promise.all(
    subtreeDeckIds(decks, id).map((subId) => {
      const deck = findEntity(decks, subId)
      if (!deck || deck.archived === archived) return undefined
      return store.getState().save(updateDeck(deck, { archived }, now))
    }),
  )
  return { ...root, archived }
}
