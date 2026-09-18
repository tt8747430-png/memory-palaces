import type { Deck, DeckStore } from '@/entities/deck'
import { createDeck, createSubdeck } from '@/features/deck'
import { childDecks } from '@/shared/lib'
import { chapterDeckName } from '../model/deck-names'

const sameName = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase()

/** A book deck is any live top-level deck of that name — including one filed in a folder. */
function findBookDeck(decks: readonly Deck[], book: string): Deck | undefined {
  return decks.find((deck) => deck.parentId === null && !deck.archived && sameName(deck.name, book))
}

/**
 * Automatic placement: a deck per book, a subdeck per chapter, both reused when they already
 * exist so a second import joins the first instead of sitting beside a copy of it.
 * Returns the id of the chapter subdeck the cards belong in.
 */
export async function ensureChapterDeck(
  store: DeckStore,
  book: string,
  chapter: number,
): Promise<string> {
  const bookDeck =
    findBookDeck(store.getState().decks, book) ?? (await createDeck(store, { name: book }))
  const chapterName = chapterDeckName(book, chapter)
  const held = childDecks(store.getState().decks, bookDeck.id).find(
    (deck) => !deck.archived && sameName(deck.name, chapterName),
  )
  return (held ?? (await createSubdeck(store, bookDeck.id, { name: chapterName }))).id
}
