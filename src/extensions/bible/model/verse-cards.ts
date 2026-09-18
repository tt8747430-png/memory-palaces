import type { ParsedCard } from '@/shared/lib'
import { formatRef, type VerseRef } from './reference'
import { stripReference } from './strip-reference'

/**
 * `1)` or `(1:1)` — the two shapes verse text arrives in. This is the app's only verse parser:
 * the one that used to live in `shared/lib/content-transfer.ts` is deleted rather than moved,
 * because two parsers for one format is one too many.
 */
const MARKER = /(?:\((\d+):(\d+)\)|(?:^|\s)(\d+)\))\s*/g

interface Segment {
  /** From a `(1:1)` marker; null when the text only numbered its verses. */
  chapter: number | null
  verse: number
  text: string
}

function splitByMarkers(text: string): Segment[] {
  const segments: Segment[] = []
  const matches = [...text.matchAll(MARKER)]
  matches.forEach((match, index) => {
    const chapter = match[1] ? Number(match[1]) : null
    const verse = Number(match[2] ?? match[3])
    const start = (match.index ?? 0) + match[0].length
    const end = matches[index + 1]?.index ?? text.length
    // Collapse the whitespace: a verse that wrapped onto the next line is one verse, not two.
    const body = stripReference(text.slice(start, end).replace(/\s+/g, ' ').trim())
    if (verse > 0 && body) segments.push({ chapter, verse, text: body })
  })
  return segments
}

/** Whether the text carries markers at all — the toggle is meaningless without them. */
export function canSplit(text: string): boolean {
  return splitByMarkers(text.trim()).length > 0
}

/**
 * `ref` is nullable on purpose: the text box is always on screen, so a learner may paste marked-up
 * scripture without touching the picker. With no reference the markers supply the fronts; with no
 * reference *and* no markers there is nothing to put on a front, so nothing is made.
 */
export function buildVerseCards(
  ref: VerseRef | null,
  text: string,
  { split = true }: { split?: boolean } = {},
): ParsedCard[] {
  const body = text.trim()
  if (!body) return []

  const segments = split ? splitByMarkers(body) : []
  if (segments.length > 0) {
    return segments.map(({ chapter, verse, text: verseText }) => ({
      front: ref
        ? formatRef({ ...ref, from: verse, to: verse })
        : chapter
          ? `${chapter}:${verse}`
          : String(verse),
      back: verseText,
    }))
  }

  return ref ? [{ front: formatRef(ref), back: stripReference(body) }] : []
}

export interface HeldRef {
  front: string
  deckId: string
}

/**
 * Checked across the whole library, not just the target deck: decks are shaped
 * book -> chapter -> verse, so the passage being added may already live somewhere else.
 */
export function findDuplicates(cards: readonly ParsedCard[], held: readonly HeldRef[]): HeldRef[] {
  const index = new Map(held.map((entry) => [entry.front.trim().toLowerCase(), entry]))
  return cards.flatMap((card) => {
    const match = index.get(card.front.trim().toLowerCase())
    return match ? [match] : []
  })
}

/**
 * The cards Add would make: the build with the duplicates dropped, unless the learner keeps them.
 * Its length labels the button, and it is exactly what the command is then handed.
 */
export function addableCards(
  built: readonly ParsedCard[],
  duplicates: readonly HeldRef[],
  keepDuplicates: boolean,
): ParsedCard[] {
  if (keepDuplicates) return [...built]
  const seen = new Set(duplicates.map((entry) => entry.front))
  return built.filter((card) => !seen.has(card.front))
}
