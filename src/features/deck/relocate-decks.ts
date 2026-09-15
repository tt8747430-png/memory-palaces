import { type DeckMove, type DeckStore, placeDecks, selectDecks, updateDeck } from '@/entities/deck'
import { idsWithoutDescendants, nowIso, subtreeDecks } from '@/shared/lib'

interface Relocation {
  archived: boolean
  at: number
}

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
