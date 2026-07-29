import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { usePendingAct } from './use-pending-act'

type Act = { kind: 'delete'; id: string } | { kind: 'import' }

afterEach(cleanup)

describe('usePendingAct', () => {
  it('starts with nothing pending', () => {
    const { result } = renderHook(() => usePendingAct<Act>())
    expect(result.current.act).toBeNull()
  })

  it('holds the requested act until it is answered', () => {
    const { result } = renderHook(() => usePendingAct<Act>())
    act(() => result.current.request({ kind: 'delete', id: 'a' }))
    expect(result.current.act).toEqual({ kind: 'delete', id: 'a' })
  })

  it('drops the act on dismiss without running anything', () => {
    const { result } = renderHook(() => usePendingAct<Act>())
    const run = vi.fn()
    act(() => result.current.request({ kind: 'import' }))
    act(() => result.current.dismiss())
    act(() => result.current.resolve(run))
    expect(result.current.act).toBeNull()
    expect(run).not.toHaveBeenCalled()
  })

  it('hands the act over once and clears it', () => {
    const { result } = renderHook(() => usePendingAct<Act>())
    const run = vi.fn()
    act(() => result.current.request({ kind: 'delete', id: 'a' }))
    act(() => result.current.resolve(run))
    expect(run).toHaveBeenCalledExactlyOnceWith({ kind: 'delete', id: 'a' })
    expect(result.current.act).toBeNull()
  })

  it('runs nothing when resolved with nothing pending', () => {
    const { result } = renderHook(() => usePendingAct<Act>())
    const run = vi.fn()
    act(() => result.current.resolve(run))
    expect(run).not.toHaveBeenCalled()
  })

  it('ignores a second confirm landing in the same tick', () => {
    const { result } = renderHook(() => usePendingAct<Act>())
    const run = vi.fn()
    act(() => result.current.request({ kind: 'delete', id: 'a' }))
    act(() => {
      result.current.resolve(run)
      result.current.resolve(run)
    })
    expect(run).toHaveBeenCalledTimes(1)
  })
})
