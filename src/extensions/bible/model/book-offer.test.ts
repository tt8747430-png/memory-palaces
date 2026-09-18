import { describe, expect, it } from 'vitest'
import { isBookPickable } from './book-offer'

const genesisOnly = new Set(['GEN' as const])

describe('isBookPickable', () => {
  it('offers a book the Bible library holds text for', () => {
    expect(isBookPickable('GEN', genesisOnly, false)).toBe(true)
  })

  it('disables a book it holds none for — the learner is steered to text that fills itself', () => {
    expect(isBookPickable('EXO', genesisOnly, false)).toBe(false)
  })

  it('offers every book when it holds no text at all — pasting is then the way in for all', () => {
    expect(isBookPickable('EXO', new Set(), false)).toBe(true)
  })

  it('offers every book in dev mode — picking one is how its text gets published', () => {
    expect(isBookPickable('EXO', genesisOnly, true)).toBe(true)
  })
})
