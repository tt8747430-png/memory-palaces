import { describe, expect, it, vi } from 'vitest'
import {
  byNewestFirst,
  byOldestFirst,
  byOrderThenCreated,
  compareNatural,
  mergeVisibleOrder,
  nextOrder,
  reorderById,
} from './order'

describe('collection orderings', () => {
  const rows = [
    { id: 'b', order: 1, createdAt: '2026-01-02' },
    { id: 'a', order: 0, createdAt: '2026-01-03' },
    { id: 'c', order: 1, createdAt: '2026-01-01' },
  ]
  const ids = (sorted: { id: string }[]) => sorted.map((row) => row.id)

  it('sorts by manual order, oldest first on a tie', () => {
    expect(ids([...rows].sort(byOrderThenCreated))).toEqual(['a', 'c', 'b'])
  })

  it('sorts newest first', () => {
    expect(ids([...rows].sort(byNewestFirst))).toEqual(['a', 'b', 'c'])
  })

  it('sorts oldest first', () => {
    expect(ids([...rows].sort(byOldestFirst))).toEqual(['c', 'b', 'a'])
  })
})

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

describe('compareNatural', () => {
  it('orders embedded numbers by value, not by digit', () => {
    const names = ['Geneza 10', 'Geneza 2', 'Geneza 1', 'Geneza 11']
    expect(names.toSorted(compareNatural)).toEqual([
      'Geneza 1',
      'Geneza 2',
      'Geneza 10',
      'Geneza 11',
    ])
  })

  it('ignores case and accents', () => {
    expect(compareNatural('éclair', 'Eclair')).toBe(0)
    expect(['b', 'A', 'a'].toSorted(compareNatural)).toEqual(['A', 'a', 'b'])
  })
})

describe('mergeVisibleOrder', () => {
  const all = ['a', 'b', 'c', 'd', 'e']

  it('is the dragged order itself when every row was on screen', () => {
    expect(mergeVisibleOrder(all, ['e', 'd', 'c', 'b', 'a'])).toEqual(['e', 'd', 'c', 'b', 'a'])
  })

  it('leaves a hidden row in the slot it already had, and fills the rest in the dragged order', () => {
    // b and d are filtered out; the learner dragged e above a among what they could see.
    expect(mergeVisibleOrder(all, ['e', 'c', 'a'])).toEqual(['e', 'b', 'c', 'd', 'a'])
  })

  it('keeps the full list whole when the drag moved nothing', () => {
    expect(mergeVisibleOrder(all, ['a', 'c', 'e'])).toEqual(all)
  })

  it('ignores an id that is not in the list, and a list with nothing visible', () => {
    expect(mergeVisibleOrder(all, ['c', 'gone', 'a'])).toEqual(['c', 'b', 'a', 'd', 'e'])
    expect(mergeVisibleOrder(all, [])).toEqual(all)
  })
})
