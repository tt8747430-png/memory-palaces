import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useMultiSelect } from './use-multi-select'

vi.mock('./haptics', () => ({ impact: vi.fn() }))

afterEach(cleanup)

describe('useMultiSelect', () => {
  it('starts inactive and empty', () => {
    const { result } = renderHook(() => useMultiSelect())
    expect(result.current.active).toBe(false)
    expect(result.current.count).toBe(0)
    expect(result.current.allSelected).toBe(false)
  })

  it('opens the mode on the row that was held, keeping it selected', () => {
    const { result } = renderHook(() => useMultiSelect())
    act(() => result.current.begin('a'))
    expect(result.current.active).toBe(true)
    expect(result.current.has('a')).toBe(true)
  })

  it('opens the mode with nothing selected, for a screen that starts from the whole list', () => {
    const { result } = renderHook(() => useMultiSelect())
    act(() => result.current.enter())
    expect(result.current.active).toBe(true)
    expect(result.current.count).toBe(0)
  })

  it('adds and removes rows one at a time', () => {
    const { result } = renderHook(() => useMultiSelect())
    act(() => result.current.begin('a'))
    act(() => result.current.toggle('b'))
    expect(result.current.count).toBe(2)
    act(() => result.current.toggle('a'))
    expect(result.current.has('a')).toBe(false)
    expect(result.current.count).toBe(1)
  })

  it('reports "all selected" against the rows the list shows', () => {
    const { result } = renderHook(() => useMultiSelect({ visibleIds: ['a', 'b'] }))
    act(() => result.current.begin('a'))
    expect(result.current.allSelected).toBe(false)
    act(() => result.current.toggle('b'))
    expect(result.current.allSelected).toBe(true)
  })

  it('select-all covers what the list shows, and flips to clearing it once it is full', () => {
    const { result } = renderHook(() => useMultiSelect({ visibleIds: ['a', 'b', 'c'] }))
    act(() => result.current.toggleAll())
    expect(result.current.count).toBe(3)
    act(() => result.current.toggleAll())
    expect(result.current.count).toBe(0)
  })

  it('follows the list as it changes, with no render in between to catch up', () => {
    const { result, rerender } = renderHook(({ ids }) => useMultiSelect({ visibleIds: ids }), {
      initialProps: { ids: ['a'] as readonly string[] },
    })
    act(() => result.current.begin('a'))
    expect(result.current.allSelected).toBe(true)
    rerender({ ids: ['a', 'b'] })
    expect(result.current.allSelected).toBe(false)
  })

  it('leaves rows the list does not show alone when clearing', () => {
    const { result } = renderHook(() => useMultiSelect({ visibleIds: ['a'] }))
    act(() => result.current.begin('filtered-out'))
    act(() => result.current.toggleAll())
    act(() => result.current.toggleAll())
    expect(result.current.has('filtered-out')).toBe(true)
  })

  it('exiting ends the mode and drops the selection', () => {
    const { result } = renderHook(() => useMultiSelect())
    act(() => result.current.begin('a'))
    act(() => result.current.exit())
    expect(result.current.active).toBe(false)
    expect(result.current.count).toBe(0)
  })

  it('keeps the same object across renders while neither the list nor the selection changes', () => {
    const ids: readonly string[] = ['a', 'b']
    const { result, rerender } = renderHook(() => useMultiSelect({ visibleIds: ids }))
    const before = result.current
    rerender()
    expect(result.current).toBe(before)
  })
})
