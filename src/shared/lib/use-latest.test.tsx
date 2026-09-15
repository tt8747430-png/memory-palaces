import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLatest } from './use-latest'

describe('useLatest', () => {
  it('holds the newest value behind one ref identity', () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: 'first' },
    })
    const ref = result.current
    expect(ref.current).toBe('first')

    rerender({ value: 'second' })

    expect(result.current).toBe(ref)
    expect(ref.current).toBe('second')
  })
})
