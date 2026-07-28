import { describe, expect, it, vi } from 'vitest'
import { nextOrder, reorderById } from './order'

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

describe('reorderById', () => {
  const write = () => vi.fn(async () => undefined)

  it('writes each item whose order changed, with its new index', async () => {
    const a = { id: 'a', order: 5 }
    const b = { id: 'b', order: 3 }
    const save = write()

    await reorderById([a, b], ['a', 'b'], save)

    expect(save.mock.calls).toEqual([
      [a, 0],
      [b, 1],
    ])
  })

  it('follows the given order, not the stored one', async () => {
    const a = { id: 'a', order: 0 }
    const b = { id: 'b', order: 1 }
    const save = write()

    await reorderById([a, b], ['b', 'a'], save)

    expect(save.mock.calls).toEqual([
      [b, 0],
      [a, 1],
    ])
  })

  it('skips items already at their target index', async () => {
    const a = { id: 'a', order: 0 }
    const b = { id: 'b', order: 9 }
    const save = write()

    await reorderById([a, b], ['a', 'b'], save)

    expect(save.mock.calls).toEqual([[b, 1]])
  })

  it('writes nothing when the order is unchanged', async () => {
    const save = write()

    await reorderById(
      [
        { id: 'a', order: 0 },
        { id: 'b', order: 1 },
      ],
      ['a', 'b'],
      save,
    )

    expect(save).not.toHaveBeenCalled()
  })

  it('ignores ids the list no longer holds', async () => {
    const a = { id: 'a', order: 3 }
    const save = write()

    await reorderById([a], ['ghost', 'a'], save)

    expect(save.mock.calls).toEqual([[a, 1]])
  })
})
