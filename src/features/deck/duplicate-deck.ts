import { cloneEntity, subtreeDecks } from '@/shared/lib'
import type { Deck, DeckStore } from '@/entities/deck'
import type { CardStore } from '@/entities/card'
import { requireDeck } from './require-deck'

/** Duplicate a deck together with its whole subtree of subdecks and every card
 *  in it. Parent links are remapped onto the fresh ids so the copy is a
 *  standalone tree; only the top deck gets the "(copy)" suffix. */
export async function duplicateDeck(
  deckStore: DeckStore,
  cardStore: CardStore,
  id: string,
): Promise<Deck> {
  requireDeck(deckStore, id)
  const decks = deckStore.getState().decks
  const subtree = subtreeDecks(decks, id) // root first, then descendants
  const now = new Date().toISOString()

  const idMap = new Map<string, string>()
  for (const deck of subtree) idMap.set(deck.id, crypto.randomUUID())

  const clones: Deck[] = subtree.map((deck) => ({
    ...cloneEntity(deck, idMap.get(deck.id)!, now),
    // The top deck keeps its place; descendants re-point at their cloned parent.
    parentId: deck.id === id ? deck.parentId : idMap.get(deck.parentId as string)!,
    name: deck.id === id ? `${deck.name} (copy)` : deck.name,
  }))
  await Promise.all(clones.map((clone) => deckStore.getState().save(clone)))

  const cardClones = cardStore
    .getState()
    .cards.filter((card) => idMap.has(card.deckId))
    .map((card) => ({
      ...cloneEntity(card, crypto.randomUUID(), now),
      deckId: idMap.get(card.deckId)!,
    }))
  await Promise.all(cardClones.map((clone) => cardStore.getState().save(clone)))

  return clones[0]!
}
