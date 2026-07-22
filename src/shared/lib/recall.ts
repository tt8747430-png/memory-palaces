export function tokenizeWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

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

export function isReferenceMarker(token: string): boolean {
  return /^\(?\d+[:.]\d+\)?[.:,]?$/.test(token)
}

export interface WordInitial {
  lead: string
  initial: string
  hidden: number
  trail: string
}

const WORD_CONNECTORS = /([-'’‑])/u

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

export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

export function normalizeInitial(char: string): string {
  return char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export type RecallSlotKind = 'correct' | 'wrong' | 'missing' | 'extra' | 'pending'

export interface RecallSlot {
  kind: RecallSlotKind
  expected?: string
  typed?: string
}

export interface RecallTypingResult {
  slots: RecallSlot[]
  correct: number
  total: number
  next?: string
  complete: boolean
}

/**
 * Evaluates a recall attempt the way a learner reproduces text — word by word, from the start.
 * The Nth word they commit is judged against the Nth word still expected, so a wrong word stays
 * red at its own spot and the word after it can still be correct. Words they have not reached yet
 * are `pending` (hidden), never mistakes, so a half-finished answer reads as unfinished rather
 * than mostly wrong.
 *
 * A one-word slip is recovered locally instead of cascading: if the current word matches the
 * *next* expected word the learner skipped one (that word is `missing`); if the *next* committed
 * word matches the current expected word they inserted a stray one (`extra`). Recovery only looks
 * one word ahead, which keeps a sparse or nonsense attempt from being re-aligned against distant
 * words — the failure mode that used to light up the entire verse.
 */
export function typedRecallStatus(answer: string, input: string): RecallTypingResult {
  const expected = tokenizeWords(answer)
  const words = tokenizeWords(input)
  const open = words.length > 0 && !/\s$/u.test(input)
  const draft = open ? words[words.length - 1]! : undefined
  const committed = open ? words.slice(0, -1) : words

  const exp = expected.map(normalizeWord)
  const com = committed.map(normalizeWord)

  const slots: RecallSlot[] = []
  let i = 0
  let j = 0
  while (j < committed.length) {
    if (i >= expected.length) {
      slots.push({ kind: 'extra', typed: committed[j]! })
      j += 1
    } else if (exp[i] === com[j]) {
      slots.push({ kind: 'correct', expected: expected[i]!, typed: committed[j]! })
      i += 1
      j += 1
    } else if (i + 1 < expected.length && exp[i + 1] === com[j]) {
      // The learner skipped a word: their word is the one after the gap.
      slots.push({ kind: 'missing', expected: expected[i]! })
      i += 1
    } else if (j + 1 < committed.length && exp[i] === com[j + 1]) {
      // The learner slipped in a stray word before the one we are waiting for.
      slots.push({ kind: 'extra', typed: committed[j]! })
      j += 1
    } else {
      slots.push({ kind: 'wrong', expected: expected[i]!, typed: committed[j]! })
      i += 1
      j += 1
    }
  }
  for (; i < expected.length; i++) slots.push({ kind: 'pending', expected: expected[i]! })

  const at = slots.findIndex((slot) => slot.kind === 'pending')
  const next = at === -1 ? undefined : slots[at]!.expected

  // A half-typed word is not a mistake yet: it only turns red once it can no longer become the
  // word we are waiting for.
  if (draft !== undefined) {
    if (next === undefined) {
      slots.push({ kind: 'extra', typed: draft })
    } else {
      const word = normalizeWord(draft)
      const goal = normalizeWord(next)
      if (word === goal) slots[at] = { kind: 'correct', expected: next, typed: draft }
      else if (!goal.startsWith(word)) slots[at] = { kind: 'wrong', expected: next, typed: draft }
    }
  }

  return {
    slots,
    correct: slots.filter((slot) => slot.kind === 'correct').length,
    total: expected.length,
    next,
    complete: expected.length > 0 && slots.every((slot) => slot.kind === 'correct'),
  }
}

/**
 * Fills in the next word the learner has not reached, replacing any half-typed word.
 */
export function withNextWord(answer: string, input: string): string {
  const { next, complete } = typedRecallStatus(answer, input)
  if (complete || next === undefined) return input
  return `${input.replace(/\S+$/u, '')}${next} `
}

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
