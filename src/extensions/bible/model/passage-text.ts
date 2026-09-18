import type { LibraryIndex } from './library-index'
import type { VerseRef } from './reference'

export interface PassageText {
  /** What the text box starts with: one verse per line, or nothing when none of it is held. */
  text: string
  /** How many of the passage's verses the Bible library holds. */
  held: number
  /** The verses it lacks, in order. */
  missing: number[]
}

/**
 * Markers, one verse to a line: a plain join would round-trip into one card for the whole range.
 * A verse the library lacks keeps its bare marker, so the learner sees where to type it — unless
 * the library lacks all of it, when an empty box says so more plainly than a column of numbers.
 */
export function passagePrefill(ref: VerseRef, index: LibraryIndex): PassageText {
  const lines: string[] = []
  const missing: number[] = []
  for (let verse = ref.from; verse <= ref.to; verse += 1) {
    const text = index.text(ref.book, ref.chapter, verse)
    if (!text) missing.push(verse)
    lines.push(text ? `${verse}) ${text}` : `${verse}) `)
  }
  const held = lines.length - missing.length
  return { text: held ? lines.join('\n') : '', held, missing }
}
