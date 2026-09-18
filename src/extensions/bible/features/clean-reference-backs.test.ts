import { describe, expect, it, vi } from 'vitest'
import { cleanReferenceBacks, countReferenceBacks } from './clean-reference-backs'

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

describe('cleanReferenceBacks', () => {
  it('rewrites only those backs, through the caller-supplied save', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const changed = await cleanReferenceBacks(cards, save)
    expect(changed).toBe(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('a', 'In the beginning.')
  })

  it('leaves a library that is already clean untouched', async () => {
    const save = vi.fn()
    expect(await cleanReferenceBacks([cards[1]!], save)).toBe(0)
    expect(save).not.toHaveBeenCalled()
  })
})
