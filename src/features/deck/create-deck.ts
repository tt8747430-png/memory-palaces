import { makeDeck, type MakeDeckInput, type Deck, type DeckStore } from '@/entities/deck'
import { newId, nextOrder, nowIso, orderSiblings } from '@/shared/lib'

export type CreateDeckInput = Omit<MakeDeckInput, 'id' | 'createdAt'>

export async function createDeck(
  store: DeckStore,
  input: CreateDeckInput,
  now: number = Date.now(),
): Promise<Deck> {
  const parentId = input.parentId ?? null
  const folderId = parentId === null ? (input.folderId ?? null) : null
  const order = input.order ?? nextOrder(orderSiblings(store.getState().decks, parentId, folderId))
  const deck = makeDeck({
    ...input,
    order,
    id: newId(),
    createdAt: nowIso(now),
  })
  await store.getState().save(deck)
  return deck
}

export async function createSubdeck(
  store: DeckStore,
  parentId: string,
  input: Omit<CreateDeckInput, 'parentId' | 'folderId'>,
  now: number = Date.now(),
): Promise<Deck> {
  return createDeck(store, { ...input, parentId }, now)
}
