import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { orderPatch, useOptimisticPatch } from './use-optimistic-patch'

interface Row {
  id: string
  order: number
  parentId: string | null
}

const rows = (...pairs: [string, number, (string | null)?][]): Row[] =>
  pairs.map(([id, order, parentId]) => ({ id, order, parentId: parentId ?? null }))

const orderOf = (items: Row[]) => [...items].sort((a, b) => a.order - b.order).map((i) => i.id)

describe('useOptimisticPatch', () => {
  it('applies a dropped order before the store has caught up', () => {
    const { result } = renderHook(() => useOptimisticPatch(rows(['a', 0], ['b', 1], ['c', 2])))

    act(() => result.current[1](orderPatch(['b', 'a', 'c'])))

    expect(orderOf(result.current[0])).toEqual(['b', 'a', 'c'])
  })

  it('holds the drop through a partially persisted emission', () => {
    const { result, rerender } = renderHook(({ items }) => useOptimisticPatch(items), {
      initialProps: { items: rows(['a', 0], ['b', 1], ['c', 2]) },
    })

    act(() => result.current[1](orderPatch(['b', 'a', 'c'])))
    // Only b's write has landed: a is still at 0, so both claim index 0.
    rerender({ items: rows(['a', 0], ['b', 0], ['c', 2]) })

    expect(orderOf(result.current[0])).toEqual(['b', 'a', 'c'])
  })

  it('holds a reparent until the new parent is stored', () => {
    const { result, rerender } = renderHook(({ items }) => useOptimisticPatch(items), {
      initialProps: { items: rows(['a', 0], ['b', 1]) },
    })

    act(() => result.current[1](new Map([['a', { parentId: 'b', order: 0 }]])))
    expect(result.current[0].find((r) => r.id === 'a')?.parentId).toBe('b')

    // The reorder write landed first; the reparent has not — the row must not
    // flick back to the group it came from.
    rerender({ items: rows(['a', 0], ['b', 1]) })
    expect(result.current[0].find((r) => r.id === 'a')?.parentId).toBe('b')

    rerender({ items: rows(['a', 0, 'b'], ['b', 1]) })
    expect(result.current[0].find((r) => r.id === 'a')?.parentId).toBe('b')
  })

  it('releases the overlay once the stored rows match', () => {
    const settled = rows(['a', 1], ['b', 0])
    const { result, rerender } = renderHook(({ items }) => useOptimisticPatch(items), {
      initialProps: { items: rows(['a', 0], ['b', 1]) },
    })

    act(() => result.current[1](orderPatch(['b', 'a'])))
    rerender({ items: settled })

    expect(result.current[0]).toBe(settled)
  })

  it('reconciles back to the store when a write never lands', () => {
    const { result, rerender } = renderHook(({ items }) => useOptimisticPatch(items), {
      initialProps: { items: rows(['a', 0], ['b', 1]) },
    })

    act(() => result.current[1](orderPatch(['b', 'a'])))
    rerender({ items: rows(['c', 0]) })

    expect(orderOf(result.current[0])).toEqual(['c'])
  })
})
