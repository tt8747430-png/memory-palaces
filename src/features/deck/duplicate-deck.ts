import { cloneEntity, subtreeDecks } from '@/shared/lib'
import type { Deck, DeckStore } from '@/entities/deck'
import type { CardStore } from '@/entities/card'
import { requireDeck } from './require-deck'

export async function duplicateDeck(
  deckStore: DeckStore,
  cardStore: CardStore,
  id: string,
): Promise<Deck> {
  requireDeck(deckStore, id)
  const decks = deckStore.getState().decks
  const subtree = subtreeDecks(decks, id)
  const now = new Date().toISOString()

  const idMap = new Map<string, string>()
  for (const deck of subtree) idMap.set(deck.id, crypto.randomUUID())

  const clones: Deck[] = subtree.map((deck) => ({
    ...cloneEntity(deck, idMap.get(deck.id)!, now),
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
