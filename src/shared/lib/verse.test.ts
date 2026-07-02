import { describe, expect, it } from 'vitest'
import {
  isVerseMarker,
  normalizeWord,
  scramble,
  tokenizeWords,
  typedVerseStatus,
  verseText,
  wordInitial,
} from './verse'

describe('verseText', () => {
  it('strips a leading reference that prefixes the verse body', () => {
    expect(
      verseText({ front: '3 John 1:1', back: '3 John 1:1 The elder unto the wellbeloved' }),
    ).toBe('The elder unto the wellbeloved')
  })

  it('returns the body unchanged when it has no leading reference', () => {
    expect(verseText({ front: 'John 3:16', back: 'For God so loved the world' })).toBe(
      'For God so loved the world',
    )
  })
})

describe('tokenizeWords', () => {
  it('splits on whitespace and drops empties', () => {
    expect(tokenizeWords('  the   quick brown ')).toEqual(['the', 'quick', 'brown'])
  })
})

describe('isVerseMarker', () => {
  it('recognizes verse-number markers, not words', () => {
    expect(isVerseMarker('15:1')).toBe(true)
    expect(isVerseMarker('(1:1)')).toBe(true)
    expect(isVerseMarker('3:16.')).toBe(true)
    expect(isVerseMarker('world')).toBe(false)
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
    // Surrounding punctuation is still peeled off, connectors inside are not.
    expect(wordInitial('„L-a.”')).toEqual({ lead: '„', initial: 'L-a', hidden: 0, trail: '.”' })
  })

  it('treats an apostrophe as an intra-word connector too', () => {
    expect(wordInitial('într’un')).toEqual({ lead: '', initial: 'î’u', hidden: 4, trail: '' })
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
    const rng = () => 0 // always picks index 0 in Fisher–Yates
    const out = scramble(input, rng)
    expect([...out].sort((a, b) => a - b)).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5]) // input not mutated
    expect(scramble(input, rng)).toEqual(out) // deterministic
  })
})

describe('typedVerseStatus', () => {
  const verse = 'For God so loved the world'

  it('marks every word pending before anything is typed', () => {
    const result = typedVerseStatus(verse, '')
    expect(result.statuses).toEqual([
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
    ])
    expect(result.correct).toBe(0)
    expect(result.total).toBe(6)
    expect(result.complete).toBe(false)
  })

  it('greens each word that matches in order, ignoring case and punctuation', () => {
    const result = typedVerseStatus(verse, 'for GOD, so')
    expect(result.statuses.slice(0, 3)).toEqual(['correct', 'correct', 'correct'])
    expect(result.statuses.slice(3)).toEqual(['pending', 'pending', 'pending'])
    expect(result.correct).toBe(3)
  })

  it('flags a wrong word at its position', () => {
    const result = typedVerseStatus(verse, 'for cat so')
    expect(result.statuses.slice(0, 3)).toEqual(['correct', 'wrong', 'correct'])
    expect(result.correct).toBe(2)
  })

  it('is complete only when the whole verse is reproduced', () => {
    expect(typedVerseStatus(verse, 'For God so loved the world.').complete).toBe(true)
    expect(typedVerseStatus(verse, 'For God so loved the').complete).toBe(false)
  })
})
