import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useHeldOrder } from './use-held-order'

afterEach(cleanup)

describe('useHeldOrder', () => {
  it('draws the store’s order while nothing is held', () => {
    const { result } = renderHook(() => useHeldOrder(['a', 'b', 'c']))
    expect(result.current.order).toEqual(['a', 'b', 'c'])
  })

  it('draws the dropped order while the store still says the old one', () => {
    const { result, rerender } = renderHook(({ ids }) => useHeldOrder(ids), {
      initialProps: { ids: ['a', 'b', 'c'] },
    })

    act(() => result.current.hold(['c', 'a', 'b']))
    expect(result.current.order).toEqual(['c', 'a', 'b'])

    // A half-applied re-emit must not snap the rows back (CODE_STYLE §10, cause 1).
    rerender({ ids: ['a', 'c', 'b'] })
    expect(result.current.order).toEqual(['c', 'a', 'b'])
  })

  it('lets go once the store agrees, so later changes come straight through', () => {
    const { result, rerender } = renderHook(({ ids }) => useHeldOrder(ids), {
      initialProps: { ids: ['a', 'b', 'c'] },
    })

    act(() => result.current.hold(['c', 'a', 'b']))
    rerender({ ids: ['c', 'a', 'b'] })
    expect(result.current.order).toEqual(['c', 'a', 'b'])

    // Another device's Sync reorders them again: the hold is gone, so this is drawn at once.
    rerender({ ids: ['b', 'a', 'c'] })
    expect(result.current.order).toEqual(['b', 'a', 'c'])
  })

  it('drops an id the store no longer has, and takes up one it has gained', () => {
    const { result, rerender } = renderHook(({ ids }) => useHeldOrder(ids), {
      initialProps: { ids: ['a', 'b', 'c'] },
    })

    act(() => result.current.hold(['c', 'b', 'a']))
    rerender({ ids: ['a', 'c', 'd'] })
    expect(result.current.order).toEqual(['c', 'a', 'd'])
  })
})
