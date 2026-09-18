import { useMemo, useState } from 'react'
import type { LibraryIndex } from './library-index'
import { type PassageText, passagePrefill } from './passage-text'
import { formatRef, type VerseRef } from './reference'

export interface VerseText {
  /** How much of the confirmed passage the Bible library holds; null until one is confirmed. */
  passage: PassageText | null
  text: string
  setText: (value: string) => void
  /** The box holds exactly what the Bible library supplied, not text the learner typed. */
  prefilled: boolean
}

/**
 * The import screen's text box: what the learner typed, or else what the Bible library holds for
 * the passage. Read again whenever the passage or the library changes — a verse that arrives by
 * Sync fills a box the learner has not touched.
 */
export function useVerseText(ref: VerseRef | null, index: LibraryIndex): VerseText {
  // What the learner typed, and the passage they typed it under. Absent until they touch the box.
  const [own, setOwn] = useState<{ ref: string | null; text: string } | null>(null)
  const passage = useMemo(() => (ref ? passagePrefill(ref, index) : null), [ref, index])

  const key = ref ? formatRef(ref) : null
  // The learner's text always wins. An empty one is an answer too — but only for the passage it was
  // cleared under: change verses, and the Bible library gets to speak again.
  const typed = own && (own.text !== '' || own.ref === key) ? own.text : null
  const prefill = passage?.text ?? ''
  const text = typed ?? prefill

  return {
    passage,
    text,
    setText: (value) => setOwn({ ref: key, text: value }),
    prefilled: prefill !== '' && text === prefill,
  }
}
