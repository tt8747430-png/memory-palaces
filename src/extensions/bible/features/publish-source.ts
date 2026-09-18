import { parseRef } from '../model/reference'
import { stripReference } from '../model/strip-reference'
import { type BibleVerse, makeBibleVerse } from '../model/verse'
import type { BibleVerseStore } from '../model/store'

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

export async function publishVerses(
  store: BibleVerseStore,
  verses: readonly BibleVerse[],
): Promise<number> {
  for (const verse of verses) await store.getState().save(verse)
  return verses.length
}
