import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { readColorScheme, useColorScheme } from './color-scheme'

afterEach(() => {
  cleanup()
  delete document.documentElement.dataset.theme
})

describe('readColorScheme', () => {
  it('reads the scheme the document is painted in', () => {
    document.documentElement.dataset.theme = 'dark'
    expect(readColorScheme()).toBe('dark')
    document.documentElement.dataset.theme = 'light'
    expect(readColorScheme()).toBe('light')
  })

  it('reads light when nothing has painted yet', () => {
    expect(readColorScheme()).toBe('light')
  })
})

describe('useColorScheme', () => {
  it('follows the document when the learner changes theme', async () => {
    document.documentElement.dataset.theme = 'light'
    const { result } = renderHook(() => useColorScheme())
    expect(result.current).toBe('light')

    // The observer reports on a microtask, which is why the change is awaited rather than read.
    await act(async () => {
      document.documentElement.dataset.theme = 'dark'
    })
    expect(result.current).toBe('dark')
  })

  it('stops watching once nothing is listening', () => {
    const { unmount } = renderHook(() => useColorScheme())
    unmount()
    document.documentElement.dataset.theme = 'dark'
    expect(readColorScheme()).toBe('dark')
  })
})
