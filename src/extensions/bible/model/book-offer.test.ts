import { describe, expect, it } from 'vitest'
import { isBookPickable } from './book-offer'

const genesisOnly = new Set(['Genesis'])

describe('isBookPickable', () => {
  it('offers a book the Bible library holds text for', () => {
    expect(isBookPickable('Genesis', genesisOnly, false)).toBe(true)
  })

  it('disables a book it holds none for — the learner is steered to text that fills itself', () => {
    expect(isBookPickable('Exodus', genesisOnly, false)).toBe(false)
  })

  it('offers every book when it holds no text at all — pasting is then the way in for all', () => {
    expect(isBookPickable('Exodus', new Set(), false)).toBe(true)
  })

  it('offers every book in dev mode — picking one is how its text gets published', () => {
    expect(isBookPickable('Exodus', genesisOnly, true)).toBe(true)
  })
})
