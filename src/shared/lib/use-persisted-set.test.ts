import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { usePersistedSet } from './use-persisted-set'

const KEY = 'test.persisted.set'

afterEach(() => {
  localStorage.clear()
})

describe('usePersistedSet', () => {
  it('starts empty when nothing is stored', () => {
    const { result } = renderHook(() => usePersistedSet(KEY))
    expect([...result.current[0]]).toEqual([])
  })

  it('hydrates from a previously stored array', () => {
    localStorage.setItem(KEY, JSON.stringify(['a', 'b']))
    const { result } = renderHook(() => usePersistedSet(KEY))
    expect([...result.current[0]].sort()).toEqual(['a', 'b'])
  })

  it('persists functional updates to localStorage', () => {
    const { result } = renderHook(() => usePersistedSet(KEY))
    act(() => {
      result.current[1]((prev) => new Set(prev).add('x'))
    })
    expect([...result.current[0]]).toEqual(['x'])
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(['x'])
  })

  it('survives a remount by reading back from storage', () => {
    const first = renderHook(() => usePersistedSet(KEY))
    act(() => {
      first.result.current[1]((prev) => new Set(prev).add('kept'))
    })
    first.unmount()

    const second = renderHook(() => usePersistedSet(KEY))
    expect([...second.result.current[0]]).toEqual(['kept'])
  })

  it('ignores malformed stored values', () => {
    localStorage.setItem(KEY, '{not json')
    const { result } = renderHook(() => usePersistedSet(KEY))
    expect([...result.current[0]]).toEqual([])
  })
})
