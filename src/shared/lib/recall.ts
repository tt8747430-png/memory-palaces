/**
 * Pure text helpers shared by the recall study modes (Blur / Rebuild / Initials /
 * Type). They work on a card's answer text: tokenizing it, reducing words to
 * first-letter cues, and scoring a typed attempt. A minimal structural input keeps
 * `shared/lib` below the entity layer.
 */

/** Split text into word tokens, keeping any attached punctuation. */
export function tokenizeWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

/**
 * The answer text a recall mode should test, with a leading copy of the prompt stripped when
 * the answer opens by repeating it — e.g. a card whose back ("2 Timotei 1:3 Îi mulțumesc…")
 * is prefixed with its front reference ("2 Timotei 1:3"). Without this the modes make the user
 * reproduce the prompt they were just shown. Case-insensitive; if stripping would empty the
 * answer, the original is kept.
 */
export function recallAnswer(prompt: string, answer: string): string {
  const p = prompt.trim()
  const a = answer.trim()
  if (p && a.length > p.length && a.slice(0, p.length).toLowerCase() === p.toLowerCase()) {
    const rest = a
      .slice(p.length)
      .replace(/^[\s:.,;–—-]+/u, '')
      .trim()
    if (rest) return rest
  }
  return a
}

/** A standalone reference/number marker like "15:1" or "(1:1)" — kept intact in the
 *  Initials view instead of reduced to a single first letter (so scripture answers
 *  keep their verse numbers legible). */
export function isReferenceMarker(token: string): boolean {
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

/** Lowercased, punctuation-free form for comparing typed words to the answer. */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

export type TypedWordStatus = 'correct' | 'wrong' | 'pending'

export interface RecallTypingResult {
  /** One status per EXPECTED word, in answer order. */
  statuses: TypedWordStatus[]
  /** The typed tokens, for rendering the attempt. */
  typed: string[]
  correct: number
  total: number
  complete: boolean
}

/** Compare a typed attempt to the answer, word by word (case/punctuation-insensitive
 * via {@link normalizeWord}). Each expected word is `correct`, `wrong`, or still
 * `pending`; `complete` once every word is reproduced in order. Drives Type mode. */
export function typedRecallStatus(answer: string, input: string): RecallTypingResult {
  const expected = tokenizeWords(answer)
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
