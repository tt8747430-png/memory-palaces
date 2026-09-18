import { describe, expect, it } from 'vitest'
import { makePendingChange } from '@/entities/pending-change'
import { namesBy, waitingItems } from './waiting-items'

const change = (table: string, entityId: string, op: 'save' | 'remove' = 'save') =>
  makePendingChange({ table, entityId, op, at: 't' })

describe('waitingItems', () => {
  it('names the documents waiting on one table, falling back to the id', () => {
    const items = waitingItems(
      [change('cards', 'c1'), change('cards', 'c2', 'remove'), change('decks', 'd1')],
      'cards',
      new Map([['c1', 'Front of c1']]),
    )
    expect(items).toEqual([
      { id: 'c1', label: 'Front of c1', op: 'save' },
      { id: 'c2', label: 'c2', op: 'remove' },
    ])
  })
})

describe('namesBy', () => {
  it('indexes a table by id under the name the learner knows it by', () => {
    const names = namesBy(
      [
        { id: 'd1', name: 'Romans' },
        { id: 'd2', name: 'Psalms' },
      ],
      (deck) => deck.name,
    )
    expect(names.get('d2')).toBe('Psalms')
    expect(names.get('d9')).toBeUndefined()
  })
})
