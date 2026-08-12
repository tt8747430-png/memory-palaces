import { afterEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useOnline } from './use-online'

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
  window.dispatchEvent(new Event(value ? 'online' : 'offline'))
}

afterEach(() => setOnline(true))

describe('useOnline', () => {
  it('reports the browser network state', () => {
    const { result } = renderHook(() => useOnline())
    expect(result.current).toBe(true)
  })

  it('re-renders when the connection drops and returns', () => {
    const { result } = renderHook(() => useOnline())
    act(() => setOnline(false))
    expect(result.current).toBe(false)
    act(() => setOnline(true))
    expect(result.current).toBe(true)
  })
})
