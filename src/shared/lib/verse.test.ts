import { describe, expect, it } from 'vitest'
import {
  isVerseMarker,
  normalizeWord,
  scramble,
  tokenizeWords,
  verseText,
  wordInitial,
} from './verse'

describe('verseText', () => {
  it('strips a leading reference that prefixes the verse body', () => {
    expect(verseText({ front: '3 John 1:1', back: '3 John 1:1 The elder unto the wellbeloved' })).toBe(
      'The elder unto the wellbeloved',
    )
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
