import type { LibraryIndex } from './library-index'
import type { VerseRef } from './reference'
import { DEFAULT_TRANSLATION } from './translations'
import { type BibleVerse, makeBibleVerse } from './verse'
import { type SourceCard, verseSources } from './verse-sources'

export interface TextFromCards {
  /** The verses the cards carry that the Bible library does not hold yet. */
  fresh: BibleVerse[]
  /** How many of the cards' verses it already holds — kept as they are. */
  held: number
  /** Which ones, so a message can name them rather than count them. */
  heldRefs: VerseRef[]
  /** How many cards were verse cards at all. */
  cards: number
}

/**
 * What adding a set of cards to the Bible library would do, before it is done: the settings page
 * previews this in its confirm dialog, then hands `fresh` to `keepMissingVerses`.
 */
export function textFromCards(
  cards: readonly SourceCard[],
  index: LibraryIndex,
  at: string,
): TextFromCards {
  const sources = verseSources(cards)
  const fresh = new Map<string, BibleVerse>()
  const heldRefs: VerseRef[] = []
  for (const source of sources) {
    if (index.hasVerse(source.book, source.chapter, source.verse)) {
      heldRefs.push({
        book: source.book,
        chapter: source.chapter,
        from: source.verse,
        to: source.verse,
      })
      continue
    }
    const verse = makeBibleVerse({ createdAt: at, translation: DEFAULT_TRANSLATION, ...source })
    if (!fresh.has(verse.id)) fresh.set(verse.id, verse)
  }
  return { fresh: [...fresh.values()], held: heldRefs.length, heldRefs, cards: sources.length }
}
