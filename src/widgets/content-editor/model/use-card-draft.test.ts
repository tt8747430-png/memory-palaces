import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { type CardDraftSource, useCardDraft } from './use-card-draft'

const stored: CardDraftSource = { front: 'bonjour', back: 'hello', hint: 'greeting' }

describe('useCardDraft', () => {
  it('seeds from the source it is given', () => {
    const { result } = renderHook(() => useCardDraft(stored, 'c1'))
    expect(result.current.front).toBe('bonjour')
    expect(result.current.hint).toBe('greeting')
    expect(result.current.valid).toBe(true)
    expect(result.current.dirty).toBe(false)
  })

  it('starts blank when there is no card yet', () => {
    const { result } = renderHook(() => useCardDraft(null, 'new'))
    expect(result.current.front).toBe('')
    expect(result.current.valid).toBe(false)
    expect(result.current.dirty).toBe(false)
  })

  it('re-seeds when the seed changes but not when the source echoes an edit back', () => {
    const { result, rerender } = renderHook(
      ({ source, seed }: { source: CardDraftSource; seed: string }) => useCardDraft(source, seed),
      { initialProps: { source: stored, seed: 'c1' } },
    )

    act(() => result.current.setFront('salut'))
    rerender({ source: { ...stored, front: 'salut' }, seed: 'c1' })
    expect(result.current.front).toBe('salut')

    rerender({ source: { front: 'merci', back: 'thanks' }, seed: 'c2' })
    expect(result.current.front).toBe('merci')
  })

  it('carries a cleared optional as undefined, so the command actually clears it', () => {
    const { result } = renderHook(() => useCardDraft(stored, 'c1'))
    act(() => result.current.setHint('   '))
    expect(result.current.changes.hint).toBeUndefined()
    expect(result.current.dirty).toBe(true)
  })

  it('trims before deciding validity and dirtiness', () => {
    const { result } = renderHook(() => useCardDraft(stored, 'c1'))
    act(() => result.current.setFront('  bonjour  '))
    expect(result.current.dirty).toBe(false)

    act(() => result.current.setBack('   '))
    expect(result.current.valid).toBe(false)
  })

  it('clear() empties every field', () => {
    const { result } = renderHook(() => useCardDraft(stored, 'c1'))
    act(() => result.current.clear())
    expect(result.current).toMatchObject({ front: '', back: '', hint: '', tip: '' })
    expect(result.current.valid).toBe(false)
  })
})
