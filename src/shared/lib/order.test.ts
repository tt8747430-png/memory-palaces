import { describe, expect, it } from 'vitest'
import { nextOrder, resequence } from './order'

describe('nextOrder', () => {
  it('is 0 for an empty list', () => {
    expect(nextOrder([])).toBe(0)
  })

  it('is one past the highest existing order', () => {
    expect(nextOrder([{ order: 0 }, { order: 3 }, { order: 1 }])).toBe(4)
  })

  it('tolerates legacy equal orders', () => {
    expect(nextOrder([{ order: 0 }, { order: 0 }, { order: 0 }])).toBe(1)
  })
})

describe('resequence', () => {
  it('returns only the items whose order changed, with their new index', () => {
    const a = { id: 'a', order: 5 }
    const b = { id: 'b', order: 3 }
    const changes = resequence([a, b])
    expect(changes).toEqual([
      { item: a, order: 0 },
      { item: b, order: 1 },
    ])
  })

  it('skips items already at their target index', () => {
    const a = { id: 'a', order: 0 }
    const b = { id: 'b', order: 9 }
    expect(resequence([a, b])).toEqual([{ item: b, order: 1 }])
  })

  it('is a no-op when already sequential', () => {
    expect(resequence([{ order: 0 }, { order: 1 }, { order: 2 }])).toEqual([])
  })
})
