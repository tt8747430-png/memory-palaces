import { makeDeck, type MakeDeckInput, type Deck, type DeckStore } from '@/entities/deck'

export type CreateDeckInput = Omit<MakeDeckInput, 'id' | 'createdAt'>

function siblingsOf(store: DeckStore, parentId: string | null, folderId: string | null): number[] {
  return store
    .getState()
    .decks.filter((d) =>
      parentId === null ? d.parentId === null && d.folderId === folderId : d.parentId === parentId,
    )
    .map((d) => d.order)
}

export async function createDeck(store: DeckStore, input: CreateDeckInput): Promise<Deck> {
  const parentId = input.parentId ?? null
  const folderId = parentId === null ? (input.folderId ?? null) : null
  const orders = siblingsOf(store, parentId, folderId)
  const order = input.order ?? (orders.length ? Math.max(...orders) + 1 : 0)
  const deck = makeDeck({
    ...input,
    order,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })
  await store.getState().save(deck)
  return deck
}

export async function createSubdeck(
  store: DeckStore,
  parentId: string,
  input: Omit<CreateDeckInput, 'parentId' | 'folderId'>,
): Promise<Deck> {
  return createDeck(store, { ...input, parentId })
}
