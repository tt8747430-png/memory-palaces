import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { Observable } from './observable'
import { useStore } from './use-store'

describe('useStore', () => {
  it('returns the current value', () => {
    const o = new Observable(1)
    const { result } = renderHook(() => useStore(o.asReadonly()))
    expect(result.current).toBe(1)
  })

  it('re-renders when the observable changes', () => {
    const o = new Observable(1)
    const { result } = renderHook(() => useStore(o.asReadonly()))
    act(() => o.set(2))
    expect(result.current).toBe(2)
  })

  it('unsubscribes on unmount', () => {
    const o = new Observable(1)
    const { unmount } = renderHook(() => useStore(o.asReadonly()))
    unmount()
    act(() => o.set(2))
    expect(o.get()).toBe(2) // no throw, no leaked listener
  })
})
