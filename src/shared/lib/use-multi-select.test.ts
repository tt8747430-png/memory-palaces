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

  it('adds and removes rows one at a time', () => {
    const { result } = renderHook(() => useMultiSelect())
    act(() => result.current.begin('a'))
    act(() => result.current.toggle('b'))
    expect(result.current.count).toBe(2)
    act(() => result.current.toggle('a'))
    expect(result.current.has('a')).toBe(false)
    expect(result.current.count).toBe(1)
  })

  it('reports "all selected" against the rows currently on screen', () => {
    const { result } = renderHook(() => useMultiSelect())
    act(() => result.current.setVisibleIds(['a', 'b']))
    act(() => result.current.begin('a'))
    expect(result.current.allSelected).toBe(false)
    act(() => result.current.toggle('b'))
    expect(result.current.allSelected).toBe(true)
  })

  it('select-all covers what is on screen, and flips to clearing it once it is full', () => {
    const { result } = renderHook(() => useMultiSelect())
    act(() => result.current.setVisibleIds(['a', 'b', 'c']))
    act(() => result.current.toggleAll())
    expect(result.current.count).toBe(3)
    act(() => result.current.toggleAll())
    expect(result.current.count).toBe(0)
  })

  it('leaves rows that are off screen alone when clearing', () => {
    const { result } = renderHook(() => useMultiSelect())
    act(() => result.current.begin('filtered-out'))
    act(() => result.current.setVisibleIds(['a']))
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

  it('keeps the same object when the list reports identical rows', () => {
    const { result } = renderHook(() => useMultiSelect())
    act(() => result.current.setVisibleIds(['a', 'b']))
    const before = result.current
    act(() => result.current.setVisibleIds(['a', 'b']))
    expect(result.current).toBe(before)
  })
})
