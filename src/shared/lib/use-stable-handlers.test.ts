import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useStableHandlers } from './use-stable-handlers'

describe('useStableHandlers', () => {
  it('keeps one object across renders, calling whatever it was last given', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(({ open }) => useStableHandlers({ open }), {
      initialProps: { open: first as (id: string) => void },
    })
    const before = result.current
    rerender({ open: second })
    expect(result.current).toBe(before)
    result.current.open('c1')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('c1')
  })

  it('says when a handler comes or goes, so a row can tell none from one', () => {
    const { result, rerender } = renderHook(
      ({ open }: { open?: (id: string) => void }) => useStableHandlers({ open }),
      { initialProps: {} as { open?: (id: string) => void } },
    )
    expect(result.current.open).toBeUndefined()
    rerender({ open: () => {} })
    expect(result.current.open).toBeTypeOf('function')
  })
})
