import { describe, expect, it } from 'vitest'
import { cleanedBack, countReferenceBacks } from './reference-backs'

const cards = [
  { id: 'a', front: 'Genesis 1:1', back: 'Genesis 1:1 In the beginning.' },
  { id: 'b', front: 'Genesis 1:2', back: 'The earth was without form.' },
  { id: 'c', front: 'Zeus', back: 'King of the gods' },
]

describe('countReferenceBacks', () => {
  it('counts only the backs that repeat their front', () => {
    expect(countReferenceBacks(cards)).toBe(1)
  })
})

describe('cleanedBack', () => {
  it('returns the back without its reference', () => {
    expect(cleanedBack(cards[0]!)).toBe('In the beginning.')
  })

  it('leaves a back that never repeated its front alone', () => {
    expect(cleanedBack(cards[1]!)).toBeNull()
  })

  it('ignores a card whose front is not a reference at all', () => {
    expect(cleanedBack(cards[2]!)).toBeNull()
  })
})
