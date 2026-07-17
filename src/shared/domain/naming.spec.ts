import { describe, expect, it } from 'vitest'
import { nextDefaultName } from './naming'

describe('nextDefaultName', () => {
  it('starts at 1 when nothing is taken', () => {
    expect(nextDefaultName('New Deck', [])).toBe('New Deck 1')
  })

  it('skips names already in use (case-insensitively)', () => {
    expect(nextDefaultName('New Deck', ['New Deck 1', 'new deck 2'])).toBe('New Deck 3')
  })

  it('fills the first gap rather than always appending', () => {
    expect(nextDefaultName('New Folder', ['New Folder 2'])).toBe('New Folder 1')
  })
})
