import { parseRef } from './reference'
import { stripReference } from './strip-reference'
import { type BibleVerse, makeBibleVerse } from './verse'

export interface SourceCard {
  front: string
  back: string
}

/** One verse's worth of a card, once the front has been read as a reference. */
interface VerseSource {
  book: string
  chapter: number
  verse: number
  text: string
}

/**
 * The cards a source record can be made from: the front names exactly one verse and the back
 * carries text. A range front (`Genesis 1:1-31`) names no single verse, so it is not one.
 * Exported so a screen can ask whether keeping the text would do anything before offering to.
 */
export function verseSources(cards: readonly SourceCard[]): VerseSource[] {
  const sources: VerseSource[] = []
  for (const card of cards) {
    const ref = parseRef(card.front)
    if (!ref || ref.to !== ref.from) continue
    const text = stripReference(card.back)
    if (!text) continue
    sources.push({ book: ref.book, chapter: ref.chapter, verse: ref.from, text })
  }
  return sources
}

/** Turns cards that look like verses into source records. Anything else is left alone. */
export function versesFromCards(
  cards: readonly SourceCard[],
  translation: string,
  at: string,
): BibleVerse[] {
  return verseSources(cards).map((source) =>
    makeBibleVerse({ createdAt: at, translation, ...source }),
  )
}
