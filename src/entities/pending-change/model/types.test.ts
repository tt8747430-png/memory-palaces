import { describe, expect, it } from 'vitest'
import { makePendingChange } from './types'

const AT = '2026-01-01T00:00:00.000Z'

describe('makePendingChange', () => {
  it('keys the entry by its document, so a second write to it lands on the same entry', () => {
    const first = makePendingChange({
      contentCollection: 'decks',
      entityId: 'd1',
      op: 'save',
      at: AT,
    })
    const second = makePendingChange({
      contentCollection: 'decks',
      entityId: 'd1',
      op: 'remove',
      at: AT,
    })

    expect(first.id).toBe('decks:d1')
    expect(second.id).toBe(first.id)
  })

  it('keeps two collections apart even for the same id', () => {
    const deck = makePendingChange({
      contentCollection: 'decks',
      entityId: 'x',
      op: 'save',
      at: AT,
    })
    const card = makePendingChange({
      contentCollection: 'cards',
      entityId: 'x',
      op: 'save',
      at: AT,
    })

    expect(deck.id).not.toBe(card.id)
  })

  it('refuses an entry with no document or no time', () => {
    expect(() =>
      makePendingChange({ contentCollection: 'decks', entityId: '', op: 'save', at: AT }),
    ).toThrow('belongs to a document')
    expect(() =>
      makePendingChange({ contentCollection: 'decks', entityId: 'd1', op: 'save', at: '' }),
    ).toThrow('happened at a time')
  })
})
