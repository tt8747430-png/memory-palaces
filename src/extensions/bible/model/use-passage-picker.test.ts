import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePassagePicker } from './use-passage-picker'

const render = () => renderHook(() => usePassagePicker())

describe('usePassagePicker', () => {
  it('starts at the books with nothing picked', () => {
    const { result } = render()
    expect(result.current.step).toBe('book')
    expect(result.current.ref).toBeNull()
  })

  it('offers the book’s chapters, then the chapter’s verses', () => {
    const { result } = render()
    act(() => result.current.pickBook('JHN'))
    expect(result.current.step).toBe('passage')
    expect(result.current.chapterOptions).toHaveLength(21)
    expect(result.current.verseOptions).toEqual([])
    act(() => result.current.pickChapter(3))
    expect(result.current.verseOptions).toHaveLength(36)
  })

  it('opens the verses at once for a book of one chapter', () => {
    const { result } = render()
    act(() => result.current.pickBook('JUD'))
    expect(result.current.chapter).toBe(1)
    expect(result.current.verseOptions).toHaveLength(25)
  })

  it('picks a range with two taps, whichever end comes first', () => {
    const { result } = render()
    act(() => result.current.pickBook('JHN'))
    act(() => result.current.pickChapter(3))
    act(() => result.current.tapVerse(16))
    expect(result.current).toMatchObject({ from: 16, to: null })
    act(() => result.current.tapVerse(18))
    expect(result.current).toMatchObject({ from: 16, to: 18 })
  })

  it('restarts the range from a verse before the first', () => {
    const { result } = render()
    act(() => result.current.pickBook('JHN'))
    act(() => result.current.pickChapter(3))
    act(() => result.current.tapVerse(16))
    act(() => result.current.tapVerse(12))
    expect(result.current).toMatchObject({ from: 12, to: null })
  })

  it('starts over with a third tap', () => {
    const { result } = render()
    act(() => result.current.pickBook('JHN'))
    act(() => result.current.pickChapter(3))
    act(() => result.current.tapVerse(16))
    act(() => result.current.tapVerse(18))
    act(() => result.current.tapVerse(5))
    expect(result.current).toMatchObject({ from: 5, to: null })
  })

  it('takes just the first verse when asked', () => {
    const { result } = render()
    act(() => result.current.pickBook('JHN'))
    act(() => result.current.pickChapter(3))
    act(() => result.current.tapVerse(16))
    act(() => result.current.justFrom())
    expect(result.current).toMatchObject({ from: 16, to: 16 })
  })

  it('confirms only a complete passage', () => {
    const { result } = render()
    act(() => result.current.pickBook('JHN'))
    act(() => result.current.pickChapter(3))
    act(() => result.current.tapVerse(16))
    act(() => result.current.confirm())
    expect(result.current.step).toBe('passage')
    act(() => result.current.tapVerse(18))
    act(() => result.current.confirm())
    expect(result.current.step).toBe('done')
    expect(result.current.ref).toEqual({ book: 'JHN', chapter: 3, from: 16, to: 18 })
  })

  it('reopens a confirmed passage with its range kept', () => {
    const { result } = render()
    act(() => result.current.jump({ book: 'JHN', chapter: 3, from: 16, to: 18 }))
    act(() => result.current.edit())
    expect(result.current).toMatchObject({ step: 'passage', from: 16, to: 18, ref: null })
  })

  it('clears the verses when the chapter changes', () => {
    const { result } = render()
    act(() => result.current.jump({ book: 'JHN', chapter: 3, from: 16, to: 18 }))
    act(() => result.current.edit())
    act(() => result.current.pickChapter(4))
    expect(result.current).toMatchObject({ chapter: 4, from: null, to: null })
  })

  it('goes back to the books, forgetting everything', () => {
    const { result } = render()
    act(() => result.current.jump({ book: 'JHN', chapter: 3, from: 16, to: 18 }))
    act(() => result.current.toBooks())
    expect(result.current).toMatchObject({ step: 'book', book: null, chapter: null })
  })

  it('jumps straight to done with a whole passage, or as far as a partial one goes', () => {
    const { result } = render()
    act(() => result.current.jump({ book: 'PSA', chapter: 23, from: null, to: null }))
    expect(result.current).toMatchObject({ step: 'passage', book: 'PSA', chapter: 23 })
    act(() => result.current.jump({ book: 'JHN', chapter: 3, from: 16, to: 16 }))
    expect(result.current.step).toBe('done')
  })
})
