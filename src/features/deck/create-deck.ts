import { makeDeck, type MakeDeckInput, type Deck, type DeckStore } from '@/entities/deck'

/** Everything {@link makeDeck} needs except the generated identity + timestamp. */
export type CreateDeckInput = Omit<MakeDeckInput, 'id' | 'createdAt'>

/** Cards that share a deck's container: same parent, and (at the root) same folder. */
function siblingsOf(store: DeckStore, parentId: string | null, folderId: string | null): number[] {
  return store
    .getState()
    .decks.filter((d) =>
      parentId === null ? d.parentId === null && d.folderId === folderId : d.parentId === parentId,
    )
    .map((d) => d.order)
}

/**
 * Command — create a deck. `parentId` set → it is a subdeck of that deck; otherwise a
 * top-level deck (optionally filed via `folderId`). The single write-path used by the UI and
 * (later) the AI Tutor. Id + clock are generated here; the factory enforces the invariants.
 */
export async function createDeck(store: DeckStore, input: CreateDeckInput): Promise<Deck> {
  const parentId = input.parentId ?? null
  const folderId = parentId === null ? (input.folderId ?? null) : null
  // Append to the end of its container unless an order is given.
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

/** Command — create a subdeck under `parentId`. Thin, intent-named wrapper over
 * {@link createDeck} for the "Add subdeck" action. */
export async function createSubdeck(
  store: DeckStore,
  parentId: string,
  input: Omit<CreateDeckInput, 'parentId' | 'folderId'>,
): Promise<Deck> {
  return createDeck(store, { ...input, parentId })
}
