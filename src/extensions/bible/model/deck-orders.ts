import type { DeckFilter, DeckGroup, DeckOrder, SortableDeck } from '@/shared/lib'
import { resolveBook } from './book-names'
import {
  BOOK_CODES,
  type BookCode,
  chapterCount,
  findBook,
  type Genre,
  type Testament,
  TESTAMENTS,
} from './canon'

export interface DeckPlace {
  book: BookCode
  /** The chapter a chapter deck names — `Geneza 3` — or null for the book's own deck. */
  chapter: number | null
}

const CHAPTER = /^(.+?)\s+(\d+)$/

/**
 * Answered once per name, for as long as the tab lives. Two orders and twelve filters all ask the
 * same question of every deck on every render of the Library — without this, each ask is a regex
 * and a name lookup, so one list of a few hundred decks costs thousands of them. Deck names are a
 * small, bounded set, and the canon they are read against never changes.
 */
const PLACES = new Map<string, DeckPlace | null>()

/**
 * Where a deck sits in the canon, read from its name: a book deck under any of the book's names,
 * a chapter deck as the app names them. A chapter the book does not have is not a place — the
 * deck is called something that happens to end in a number.
 */
export function deckPlace(name: string): DeckPlace | null {
  const known = PLACES.get(name)
  if (known !== undefined || PLACES.has(name)) return known ?? null
  const place = readPlace(name)
  PLACES.set(name, place)
  return place
}

function readPlace(name: string): DeckPlace | null {
  const book = resolveBook(name)
  if (book) return { book, chapter: null }
  const match = CHAPTER.exec(name.trim())
  if (!match) return null
  const [, bookName = '', chapter = ''] = match
  const inBook = resolveBook(bookName)
  if (!inBook) return null
  const number = Number(chapter)
  return number >= 1 && number <= chapterCount(inBook) ? { book: inBook, chapter: number } : null
}

/** Room for every chapter of every book, and a book's own deck ahead of its first chapter. */
const CHAPTER_SPAN = 200

/** Canon position by code. `indexOf` is a scan, and ranking a list asks once per deck. */
const BOOK_INDEX = new Map(BOOK_CODES.map((code, at) => [code, at]))

const bookIndex = (book: BookCode): number => BOOK_INDEX.get(book) ?? 0

const placeRank = (place: DeckPlace): number =>
  bookIndex(place.book) * CHAPTER_SPAN + (place.chapter ?? 0)

const OTHER: DeckGroup = { id: 'other', labelKey: 'bible:sort.otherDecks' }

const TESTAMENT_GROUP: Record<'old' | 'new', DeckGroup> = {
  old: { id: 'old', labelKey: 'bible:sort.oldTestament' },
  new: { id: 'new', labelKey: 'bible:sort.newTestament' },
}

/** The shelves by kind, in the order the canon lays them out. */
const GENRES: readonly Genre[] = [
  'law',
  'history',
  'wisdom',
  'majorProphets',
  'minorProphets',
  'gospels',
  'acts',
  'pauline',
  'general',
  'apocalyptic',
]

/** Shelf position by kind — the same reason as `BOOK_INDEX`. */
const GENRE_INDEX = new Map(GENRES.map((genre, at) => [genre, at]))

const genreGroup = (genre: Genre): DeckGroup => ({
  id: genre,
  labelKey: `bible:sort.genres.${genre}`,
})

/** Books in canon order, chapters in number order; two shelves, one per testament. */
export const CANON_ORDER: DeckOrder = {
  id: 'bible:canon',
  rank: (deck: SortableDeck) => {
    const place = deckPlace(deck.name)
    return place ? placeRank(place) : null
  },
  group: (deck: SortableDeck) => {
    const place = deckPlace(deck.name)
    return place ? TESTAMENT_GROUP[findBook(place.book).testament] : OTHER
  },
}

/** The same order, shelved by kind of book — Law, History, the prophets major and minor, and on. */
export const BY_GENRE: DeckOrder = {
  id: 'bible:genre',
  rank: (deck: SortableDeck) => {
    const place = deckPlace(deck.name)
    if (!place) return null
    return (
      (GENRE_INDEX.get(findBook(place.book).genre) ?? 0) * BOOK_CODES.length * CHAPTER_SPAN +
      placeRank(place)
    )
  },
  group: (deck: SortableDeck) => {
    const place = deckPlace(deck.name)
    return place ? genreGroup(findBook(place.book).genre) : OTHER
  },
}

export interface BookFilter extends DeckFilter {
  /** The same shelf the orders head the rows with, so the menu and the headings share their names. */
  labelKey: string
}

const testamentFilter = (testament: Testament): BookFilter => ({
  id: `bible:${testament}`,
  labelKey: TESTAMENT_GROUP[testament].labelKey,
  keep: (deck) => {
    const place = deckPlace(deck.name)
    return place !== null && findBook(place.book).testament === testament
  },
})

const genreFilter = (genre: Genre): BookFilter => ({
  id: `bible:${genre}`,
  labelKey: genreGroup(genre).labelKey,
  keep: (deck) => {
    const place = deckPlace(deck.name)
    return place !== null && findBook(place.book).genre === genre
  },
})

/** A testament, then a kind of book: each keeps the decks — book and chapter alike — shelved there. */
export const BOOK_FILTERS: readonly BookFilter[] = [
  ...TESTAMENTS.map(testamentFilter),
  ...GENRES.map(genreFilter),
]
