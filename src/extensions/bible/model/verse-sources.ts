import { parseRef } from './reference'
import { stripReference } from './strip-reference'
import { type BibleVerse, makeBibleVerse } from './verse'

export interface SourceCard {
  front: string
  back: string
}

/** Turns cards that look like verses into source records. Anything else is left alone. */
export function versesFromCards(cards: readonly SourceCard[], at: string): BibleVerse[] {
  const verses: BibleVerse[] = []
  for (const card of cards) {
    const ref = parseRef(card.front)
    if (!ref || ref.to !== ref.from) continue
    const text = stripReference(card.back)
    if (!text) continue
    verses.push(
      makeBibleVerse({
        createdAt: at,
        book: ref.book,
        chapter: ref.chapter,
        verse: ref.from,
        text,
      }),
    )
  }
  return verses
}
