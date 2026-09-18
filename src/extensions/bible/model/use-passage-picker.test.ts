import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePassagePicker } from './use-passage-picker'

describe('usePassagePicker', () => {
  it('starts on the book step with no reference', () => {
    const { result } = renderHook(() => usePassagePicker())
    expect(result.current.step).toBe('book')
    expect(result.current.ref).toBeNull()
  })

  it('walks book, chapter, start, end', () => {
    const { result } = renderHook(() => usePassagePicker())
    act(() => result.current.pickBook('Genesis'))
    expect(result.current.step).toBe('chapter')
    act(() => result.current.pickChapter(1))
    expect(result.current.step).toBe('from')
    act(() => result.current.pickFrom(1))
    expect(result.current.step).toBe('to')
    act(() => result.current.pickTo(31))
    expect(result.current.step).toBe('done')
    expect(result.current.ref).toEqual({ book: 'Genesis', chapter: 1, from: 1, to: 31 })
  })

  it('offers only verses after the start — "Just verse N" covers the equal case, so no number repeats', () => {
    const { result } = renderHook(() => usePassagePicker())
    act(() => result.current.pickBook('Genesis'))
    act(() => result.current.pickChapter(1))
    act(() => result.current.pickFrom(30))
    expect(result.current.endOptions).toEqual([31])
  })

  it('start over clears everything', () => {
    const { result } = renderHook(() => usePassagePicker())
    act(() => result.current.pickBook('Genesis'))
    act(() => result.current.pickChapter(1))
    act(() => result.current.startOver())
    expect(result.current.step).toBe('book')
    expect(result.current.book).toBeNull()
  })

  it('change verses returns to the start step, keeping book and chapter', () => {
    const { result } = renderHook(() => usePassagePicker())
    act(() => result.current.pickBook('Genesis'))
    act(() => result.current.pickChapter(1))
    act(() => result.current.pickFrom(1))
    act(() => result.current.pickTo(5))
    act(() => result.current.changeVerses())
    expect(result.current.step).toBe('from')
    expect(result.current.book).toBe('Genesis')
    expect(result.current.chapter).toBe(1)
  })
})
