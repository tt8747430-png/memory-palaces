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

/** Character-level edit distance — used only to tell a typo apart from a different word. */
function charDistance(a: string, b: string): number {
  const n = a.length
  const m = b.length
  if (n === 0) return m
  if (m === 0) return n
  let prev = Array.from({ length: m + 1 }, (_, j) => j)
  let curr = new Array<number>(m + 1)
  for (let i = 1; i <= n; i++) {
    curr[0] = i
    for (let j = 1; j <= m; j++) {
      const sub = prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)
      curr[j] = Math.min(sub, prev[j]! + 1, curr[j - 1]! + 1)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[m]!
}

/**
 * Two normalized words are "near" when one is a small typo of the other — at most two
 * character edits apart and sharing more than they differ. It keeps a mistyped word paired
 * with the word it was aiming at instead of skipping a run of expected words to reach a
 * distant same-cost match.
 */
function nearWord(a: string, b: string): boolean {
  const dist = charDistance(a, b)
  return dist <= 2 && dist < Math.max(a.length, b.length)
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

function alignWords(expected: string[], typed: string[]): RecallSlot[] {
  const n = expected.length
  const m = typed.length
  const left = expected.map(normalizeWord)
  const right = typed.map(normalizeWord)

  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) cost[i]![m] = cost[i + 1]![m]! + 1
  for (let j = m - 1; j >= 0; j--) cost[n]![j] = cost[n]![j + 1]! + 1
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const swap = cost[i + 1]![j + 1]! + (left[i] === right[j] ? 0 : 1)
      cost[i]![j] = Math.min(swap, cost[i + 1]![j]! + 1, cost[i]![j + 1]! + 1)
    }
  }

  // Ties are broken towards the reading a learner recognises: an exact match first, then a
  // near-miss kept in place (a typo of the word we are waiting for), then a stray word, then
  // a skipped one. Only when nothing else explains the cost is a word wrong.
  const slots: RecallSlot[] = []
  let i = 0
  let j = 0
  while (i < n || j < m) {
    const paired = i < n && j < m
    if (paired && left[i] === right[j] && cost[i]![j] === cost[i + 1]![j + 1]!) {
      slots.push({ kind: 'correct', expected: expected[i]!, typed: typed[j]! })
      i += 1
      j += 1
    } else if (
      paired &&
      cost[i]![j] === cost[i + 1]![j + 1]! + 1 &&
      nearWord(left[i]!, right[j]!)
    ) {
      // Substituting here is optimal and the words are near — a typo, not a skip. Keep it
      // paired so the mistake shows at its own spot and the next word can still be correct.
      slots.push({ kind: 'wrong', expected: expected[i]!, typed: typed[j]! })
      i += 1
      j += 1
    } else if (i >= n || (j < m && cost[i]![j] === cost[i]![j + 1]! + 1)) {
      slots.push({ kind: 'extra', typed: typed[j]! })
      j += 1
    } else if (j >= m || cost[i]![j] === cost[i + 1]![j]! + 1) {
      slots.push({ kind: 'missing', expected: expected[i]! })
      i += 1
    } else {
      slots.push({ kind: 'wrong', expected: expected[i]!, typed: typed[j]! })
      i += 1
      j += 1
    }
  }
  return slots
}

/**
 * Words the learner has not reached yet are `pending`, not mistakes — so an answer typed
 * halfway through reads as unfinished rather than half wrong.
 */
function softenTail(slots: RecallSlot[]): RecallSlot[] {
  const out = [...slots]
  for (let k = out.length - 1; k >= 0; k--) {
    const slot = out[k]!
    if (slot.kind !== 'missing') break
    out[k] = { kind: 'pending', expected: slot.expected }
  }
  return out
}

export function typedRecallStatus(answer: string, input: string): RecallTypingResult {
  const expected = tokenizeWords(answer)
  const words = tokenizeWords(input)
  const open = words.length > 0 && !/\s$/u.test(input)
  const draft = open ? words[words.length - 1]! : undefined
  const committed = open ? words.slice(0, -1) : words

  const slots = softenTail(alignWords(expected, committed))
  const at = slots.findIndex((slot) => slot.kind === 'pending')
  const next = at === -1 ? undefined : slots[at]!.expected

  // A half-typed word is not a mistake yet: it only turns red once it can no longer become
  // the word we are waiting for.
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
