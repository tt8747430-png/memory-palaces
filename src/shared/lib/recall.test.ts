import { describe, expect, it } from 'vitest'
import {
  isReferenceMarker,
  normalizeInitial,
  normalizeWord,
  recallAnswer,
  scramble,
  tokenizeWords,
  typedRecallStatus,
  withNextWord,
  wordInitial,
} from './recall'

describe('tokenizeWords', () => {
  it('splits on whitespace and drops empties', () => {
    expect(tokenizeWords('  the   quick brown ')).toEqual(['the', 'quick', 'brown'])
  })
})

describe('recallAnswer', () => {
  it('strips a leading reference the answer repeats from the prompt', () => {
    expect(recallAnswer('2 Timotei 1:3', '2 Timotei 1:3 Îi mulțumesc lui Dumnezeu')).toBe(
      'Îi mulțumesc lui Dumnezeu',
    )
  })

  it('ignores case and trims the separator after the reference', () => {
    expect(recallAnswer('John 3:16', 'JOHN 3:16 — For God so loved')).toBe('For God so loved')
  })

  it('leaves the answer untouched when it does not repeat the prompt', () => {
    expect(recallAnswer('Capital of France', 'Paris')).toBe('Paris')
  })

  it('keeps the original when stripping would empty it', () => {
    expect(recallAnswer('Paris', 'Paris')).toBe('Paris')
  })
})

describe('isReferenceMarker', () => {
  it('recognizes reference/number markers, not words', () => {
    expect(isReferenceMarker('15:1')).toBe(true)
    expect(isReferenceMarker('(1:1)')).toBe(true)
    expect(isReferenceMarker('3:16.')).toBe(true)
    expect(isReferenceMarker('world')).toBe(false)
  })
})

describe('wordInitial', () => {
  it('keeps surrounding punctuation and exposes only the first letter', () => {
    expect(wordInitial('Hello,')).toEqual({ lead: '', initial: 'H', hidden: 4, trail: ',' })
    expect(wordInitial('"Word')).toEqual({ lead: '"', initial: 'W', hidden: 3, trail: '' })
  })

  it('keeps intra-word hyphens and cues the first letter of each part', () => {
    expect(wordInitial('s-a')).toEqual({ lead: '', initial: 's-a', hidden: 0, trail: '' })
    expect(wordInitial('M-ati')).toEqual({ lead: '', initial: 'M-a', hidden: 2, trail: '' })
    expect(wordInitial('„L-a.”')).toEqual({ lead: '„', initial: 'L-a', hidden: 0, trail: '.”' })
  })

  it('treats an apostrophe as an intra-word connector too', () => {
    expect(wordInitial('într’un')).toEqual({ lead: '', initial: 'î’u', hidden: 4, trail: '' })
  })
})

describe('normalizeInitial', () => {
  it('matches a plain keyboard letter against a diacritic initial, case-insensitively', () => {
    expect(normalizeInitial('Ș')).toBe('s')
    expect(normalizeInitial('s')).toBe('s')
    expect(normalizeInitial('Î')).toBe('i')
    expect(normalizeInitial('ă')).toBe('a')
  })
})

describe('normalizeWord', () => {
  it('lowercases and strips punctuation for comparison', () => {
    expect(normalizeWord('"Hello,"')).toBe('hello')
  })
})

describe('scramble', () => {
  it('is deterministic under an injected rng and preserves every element', () => {
    const input = [1, 2, 3, 4, 5]
    const rng = () => 0
    const out = scramble(input, rng)
    expect([...out].sort((a, b) => a - b)).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
    expect(scramble(input, rng)).toEqual(out)
  })
})

describe('typedRecallStatus', () => {
  const answer = 'For God so loved the world'
  const kinds = (input: string) => typedRecallStatus(answer, input).slots.map((slot) => slot.kind)

  it('marks every word pending before anything is typed', () => {
    const result = typedRecallStatus(answer, '')
    expect(result.slots.map((slot) => slot.kind)).toEqual(Array<string>(6).fill('pending'))
    expect(result.correct).toBe(0)
    expect(result.total).toBe(6)
    expect(result.next).toBe('For')
    expect(result.complete).toBe(false)
  })

  it('greens each word that matches in order, ignoring case and punctuation', () => {
    const result = typedRecallStatus(answer, 'for GOD, so ')
    expect(result.slots.map((slot) => slot.kind)).toEqual([
      'correct',
      'correct',
      'correct',
      'pending',
      'pending',
      'pending',
    ])
    expect(result.correct).toBe(3)
    expect(result.next).toBe('loved')
  })

  it('flags a wrong word at its position without disturbing the rest', () => {
    const result = typedRecallStatus(answer, 'for cat so ')
    expect(result.slots.slice(0, 3)).toEqual([
      { kind: 'correct', expected: 'For', typed: 'for' },
      { kind: 'wrong', expected: 'God', typed: 'cat' },
      { kind: 'correct', expected: 'so', typed: 'so' },
    ])
    expect(result.correct).toBe(2)
  })

  it('reports a skipped word as missing instead of cascading every word after it', () => {
    const result = typedRecallStatus(answer, 'for so loved the world')
    expect(result.slots.map((slot) => slot.kind)).toEqual([
      'correct',
      'missing',
      'correct',
      'correct',
      'correct',
      'correct',
    ])
    expect(result.slots[1]).toEqual({ kind: 'missing', expected: 'God' })
    expect(result.complete).toBe(false)
  })

  it('reports an interjected word as extra, keeping the answer aligned', () => {
    const result = typedRecallStatus(answer, 'for God truly so ')
    expect(result.slots.map((slot) => slot.kind)).toEqual([
      'correct',
      'correct',
      'extra',
      'correct',
      'pending',
      'pending',
      'pending',
    ])
    expect(result.slots[2]).toEqual({ kind: 'extra', typed: 'truly' })
    expect(result.next).toBe('loved')
  })

  it('keeps a typo in place instead of cascading the words after it to missing', () => {
    // `loced` is a one-letter typo of `loved`; the words after it are correct. Without the
    // near-word tie-break the aligner would skip `loved the world` as missing and pair the
    // typo with a distant same-cost match.
    const result = typedRecallStatus(answer, 'For God so loced the world')
    expect(result.slots.map((slot) => slot.kind)).toEqual([
      'correct',
      'correct',
      'correct',
      'wrong',
      'correct',
      'correct',
    ])
    expect(result.slots[3]).toEqual({ kind: 'wrong', expected: 'loved', typed: 'loced' })
  })

  it('reads a transposition as a single wrong word, not a skip', () => {
    const result = typedRecallStatus(answer, 'For God so loved teh world')
    expect(result.slots.map((slot) => slot.kind)).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'wrong',
      'correct',
    ])
    expect(result.slots[4]).toEqual({ kind: 'wrong', expected: 'the', typed: 'teh' })
  })

  it('judges sparse wrong input in place and hides everything not yet reached', () => {
    // Regression: short nonsense words used to be re-aligned against distant matches, marking
    // the whole answer `missing`. They now sit wrong at their own position and the rest stays
    // pending (hidden).
    const result = typedRecallStatus(answer, 'xx yy zz')
    expect(result.slots.map((slot) => slot.kind)).toEqual([
      'wrong',
      'wrong',
      'wrong',
      'pending',
      'pending',
      'pending',
    ])
    expect(result.slots.slice(0, 3)).toEqual([
      { kind: 'wrong', expected: 'For', typed: 'xx' },
      { kind: 'wrong', expected: 'God', typed: 'yy' },
      { kind: 'wrong', expected: 'so', typed: 'zz' },
    ])
  })

  it('leaves a half-typed word pending until it can no longer become the next word', () => {
    expect(kinds('for God so lov')).toEqual([
      'correct',
      'correct',
      'correct',
      'pending',
      'pending',
      'pending',
    ])
    expect(kinds('for God so lox')[3]).toBe('wrong')
  })

  it('is complete only when the whole answer is reproduced', () => {
    expect(typedRecallStatus(answer, 'For God so loved the world.').complete).toBe(true)
    expect(typedRecallStatus(answer, 'For God so loved the').complete).toBe(false)
    expect(typedRecallStatus(answer, 'For God so loved the world today').complete).toBe(false)
  })
})

describe('withNextWord', () => {
  const answer = 'For God so loved the world'

  it('appends the next word the learner has not reached', () => {
    expect(withNextWord(answer, '')).toBe('For ')
    expect(withNextWord(answer, 'For God ')).toBe('For God so ')
  })

  it('replaces a half-typed word rather than doubling it', () => {
    expect(withNextWord(answer, 'For God lo')).toBe('For God so ')
  })

  it('leaves a finished answer untouched', () => {
    expect(withNextWord(answer, 'For God so loved the world')).toBe('For God so loved the world')
  })
})
