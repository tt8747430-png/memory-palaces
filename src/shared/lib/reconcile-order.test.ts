import { describe, expect, it } from 'vitest'
import { reconcileHeldOrder } from './reconcile-order'

describe('reconcileHeldOrder', () => {
  const committed = ['d', 'c', 'b', 'a']

  it('holds the committed order through a store emission that has only half-applied it', () => {
    const { order, settled } = reconcileHeldOrder(committed, ['d', 'a', 'b', 'c'])
    expect(order).toEqual(committed)
    expect(settled).toBe(false)
  })

  it('releases the hold once the store agrees', () => {
    const { order, settled } = reconcileHeldOrder(committed, ['d', 'c', 'b', 'a'])
    expect(order).toEqual(committed)
    expect(settled).toBe(true)
  })

  it('reconciles membership: drops removed rows and slots new ones after the held order', () => {
    const { order, settled } = reconcileHeldOrder(committed, ['a', 'c', 'd', 'e'])
    expect(order).toEqual(['d', 'c', 'a', 'e'])
    expect(settled).toBe(false)
  })
})
