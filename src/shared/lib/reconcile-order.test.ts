import { describe, expect, it } from 'vitest'
import { reconcileHeldOrder } from './reconcile-order'

describe('reconcileHeldOrder', () => {
  const committed = ['d', 'c', 'b', 'a'] // just dropped: reversed the four rows

  it('holds the committed order through a store emission that has only half-applied it', () => {
    // The store has moved 'd' to the front but not yet the rest — a partial write.
    const { order, settled } = reconcileHeldOrder(committed, ['d', 'a', 'b', 'c'])
    expect(order).toEqual(committed) // stays put, no row-by-row cascade
    expect(settled).toBe(false)
  })

  it('releases the hold once the store agrees', () => {
    const { order, settled } = reconcileHeldOrder(committed, ['d', 'c', 'b', 'a'])
    expect(order).toEqual(committed)
    expect(settled).toBe(true)
  })

  it('reconciles membership: drops removed rows and slots new ones after the held order', () => {
    // 'b' was deleted mid-flight and 'e' was added.
    const { order, settled } = reconcileHeldOrder(committed, ['a', 'c', 'd', 'e'])
    expect(order).toEqual(['d', 'c', 'a', 'e'])
    expect(settled).toBe(false)
  })
})
