import type { LibraryIndex } from './library-index'
import { DEFAULT_TRANSLATION } from './translations'
import { type BibleVerse, makeBibleVerse } from './verse'
import { type SourceCard, verseSources } from './verse-sources'

export interface TextFromCards {
  /** The verses the cards carry that the Bible library does not hold yet. */
  fresh: BibleVerse[]
  /** How many of the cards' verses it already holds — kept as they are. */
  held: number
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
  let held = 0
  for (const source of sources) {
    if (index.hasVerse(source.book, source.chapter, source.verse)) {
      held += 1
      continue
    }
    const verse = makeBibleVerse({ createdAt: at, translation: DEFAULT_TRANSLATION, ...source })
    if (!fresh.has(verse.id)) fresh.set(verse.id, verse)
  }
  return { fresh: [...fresh.values()], held, cards: sources.length }
}
