import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useNow } from './use-now'

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-18T09:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts at the current time', () => {
    const { result } = renderHook(() => useNow())
    expect(result.current).toBe(Date.parse('2026-07-18T09:00:00.000Z'))
  })

  it('advances on the interval so due counts stop going stale', () => {
    const { result } = renderHook(() => useNow(60_000))

    // `advanceTimersByTime` moves the mocked wall clock too — no `setSystemTime` needed.
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current).toBe(Date.parse('2026-07-18T09:01:00.000Z'))
  })

  /** The case a mount-frozen clock got wrong: a backgrounded PWA never unmounts, and its
   *  timers are throttled while hidden, so returning to the tab must resync immediately. */
  it('resyncs when the tab becomes visible again', () => {
    const { result } = renderHook(() => useNow())

    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    act(() => {
      vi.setSystemTime(new Date('2026-07-18T14:00:00.000Z'))
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toBe(Date.parse('2026-07-18T14:00:00.000Z'))
    visibility.mockRestore()
  })

  it('ignores visibilitychange while the tab is hidden', () => {
    const { result } = renderHook(() => useNow())

    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => {
      vi.setSystemTime(new Date('2026-07-18T14:00:00.000Z'))
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toBe(Date.parse('2026-07-18T09:00:00.000Z'))
    visibility.mockRestore()
  })

  it('stops ticking after unmount', () => {
    const { unmount } = renderHook(() => useNow(60_000))
    unmount()

    expect(() =>
      act(() => {
        vi.advanceTimersByTime(180_000)
      }),
    ).not.toThrow()
  })
})
