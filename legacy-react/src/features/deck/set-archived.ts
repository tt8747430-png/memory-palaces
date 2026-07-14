import { subtreeDeckIds } from '@/shared/lib'
import { type Deck, type DeckStore, updateDeck } from '@/entities/deck'
import { requireDeck } from './require-deck'

/** Archiving (or restoring) a deck applies to its whole subtree, so subdecks
 *  travel with their parent instead of being orphaned — visible in neither the
 *  library nor the archive. */
export async function setDeckArchived(
  store: DeckStore,
  id: string,
  archived: boolean,
): Promise<Deck> {
  const root = requireDeck(store, id)
  const decks = store.getState().decks
  const now = new Date().toISOString()
  await Promise.all(
    subtreeDeckIds(decks, id).map((subId) => {
      const deck = decks.find((d) => d.id === subId)
      if (!deck || deck.archived === archived) return undefined
      return store.getState().save(updateDeck(deck, { archived }, now))
    }),
  )
  return { ...root, archived }
}
