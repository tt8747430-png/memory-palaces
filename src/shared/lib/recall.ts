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

export type TypedWordStatus = 'correct' | 'wrong' | 'pending'

export interface RecallTypingResult {
  statuses: TypedWordStatus[]
  typed: string[]
  correct: number
  total: number
  complete: boolean
}

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
