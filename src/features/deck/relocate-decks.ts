import { type DeckMove, type DeckStore, placeDecks, selectDecks, updateDeck } from '@/entities/deck'
import { idsWithoutDescendants, nowIso, subtreeDecks } from '@/shared/lib'

/** Which side of the archive a relocation lands on, and when it was made. */
interface Relocation {
  archived: boolean
  at: number
}

/**
 * Stands each deck of a batch at its place with `archived` set across everything under it — how
 * decks go into the archive and come out of it. A deck whose ancestor is also in the batch is
 * carried by it, not placed on its own.
 */
export async function relocateDecks(
  store: DeckStore,
  moves: readonly DeckMove[],
  { archived, at }: Relocation,
): Promise<void> {
  const decks = selectDecks(store.getState())
  const carriers = new Set(
    idsWithoutDescendants(
      decks,
      moves.map((m) => m.id),
    ),
  )
  const placed = placeDecks(
    decks,
    moves.filter((m) => carriers.has(m.id)),
  )
  const now = nowIso(at)
  const writes = [...placed].flatMap(([id, changes]) =>
    subtreeDecks(decks, id).flatMap((deck) => {
      if (deck.id === id) return [updateDeck(deck, { ...changes, archived }, now)]
      return deck.archived === archived ? [] : [updateDeck(deck, { archived }, now)]
    }),
  )
  await Promise.all(writes.map((deck) => store.getState().save(deck)))
}
