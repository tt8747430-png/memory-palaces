/**
 * Helpers for the verse-study modes (Blur / Words / Initials / Type). A verse
 * locus stores its reference in `front` (e.g. "3 John 1:1") and the verse text
 * in `back`; some imports prefix the body with the reference, so `verseText`
 * strips a leading reference to recover the prose to memorize. Takes a minimal
 * structural shape so `shared/lib` stays below the entity layer.
 */
export interface VerseSource {
  front?: string
  back?: string
}

/** The pure verse prose: `back` with a leading reference stripped when present. */
export function verseText(source: VerseSource): string {
  const back = (source.back ?? '').trim()
  const front = (source.front ?? '').trim()
  if (front && back.startsWith(front)) {
    const rest = back.slice(front.length).trim()
    return rest || back
  }
  return back
}

/** Split text into word tokens, keeping any attached punctuation. */
export function tokenizeWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

/** A standalone verse-number marker like "15:1" or "(1:1)" — kept intact in the
 *  Initials view instead of reduced to a single first letter. */
export function isVerseMarker(token: string): boolean {
  return /^\(?\d+[:.]\d+\)?[.:,]?$/.test(token)
}

export interface WordInitial {
  /** Leading punctuation kept before the cue (e.g. an opening quote). */
  lead: string
  /** The recall cue: the first letter of each hyphen/apostrophe-joined part, with the
   *  connectors kept intact — so "s-a" → "s-a" and "M-ati" → "M-a" rather than collapsing to a
   *  single letter. */
  initial: string
  /** Count of hidden letters across all parts, for sizing the underline. */
  hidden: number
  /** Trailing punctuation kept after the word. */
  trail: string
}

/** Characters that join a word internally (hyphen, apostrophes) — kept in the cue so a
 *  contraction/compound reads as itself instead of a lone letter. */
const WORD_CONNECTORS = /([-'’‑])/u

/** Break a word into its first-letter cue plus the punctuation around it. A word joined by a
 *  hyphen or apostrophe keeps that connector and cues the first letter of each part. */
export function wordInitial(token: string): WordInitial {
  const lead = token.match(/^[^\p{L}\p{N}]*/u)?.[0] ?? ''
  const trail = token.match(/[^\p{L}\p{N}]*$/u)?.[0] ?? ''
  const core = token.slice(lead.length, token.length - trail.length)

  let initial = ''
  let hidden = 0
  for (const part of core.split(WORD_CONNECTORS)) {
    if (part === '') continue
    if (WORD_CONNECTORS.test(part)) {
      initial += part
    } else {
      initial += part.charAt(0)
      hidden += Math.max(0, part.length - 1)
    }
  }
  return { lead, initial, hidden, trail }
}

/** Lowercased, punctuation-free form for comparing typed words to the verse. */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

export type TypedWordStatus = 'correct' | 'wrong' | 'pending'

export interface VerseTypingResult {
  /** One status per EXPECTED word, in verse order. */
  statuses: TypedWordStatus[]
  /** The typed tokens, for rendering the attempt. */
  typed: string[]
  correct: number
  total: number
  complete: boolean
}

/** Compare a typed attempt to the verse, word by word (case/punctuation-insensitive
 * via {@link normalizeWord}). Each expected word is `correct`, `wrong`, or still
 * `pending`; `complete` once every word is reproduced in order. Drives the Type mode. */
export function typedVerseStatus(verse: string, input: string): VerseTypingResult {
  const expected = tokenizeWords(verse)
  const typed = tokenizeWords(input)
  const statuses: TypedWordStatus[] = expected.map((word, i) => {
    if (i >= typed.length) return 'pending'
    return normalizeWord(typed[i]!) === normalizeWord(word) ? 'correct' : 'wrong'
  })
  const correct = statuses.filter((status) => status === 'correct').length
  const complete =
    typed.length >= expected.length && statuses.every((status) => status === 'correct')
  return { statuses, typed, correct, total: expected.length, complete }
}

/** Fisher–Yates shuffle returning a new array. `rng` is injectable for tests. */
export function scramble<T>(input: readonly T[], rng: () => number = Math.random): T[] {
  const result = [...input]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = result[i]!
    result[i] = result[j]!
    result[j] = tmp
  }
  return result
}
