import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { makeCard } from '@/entities/card'
import { useCardBrowser } from './use-card-browser'

afterEach(cleanup)

const CREATED = new Date(0).toISOString()
const CARDS = ['c1', 'c2', 'c3', 'c4'].map((id) =>
  makeCard({ id, createdAt: CREATED, deckId: 'd1', front: `${id} front`, back: `${id} back` }),
)

function setup(startId = 'c3') {
  const shellRef = { current: null }
  return renderHook(() =>
    useCardBrowser({ open: true, cards: CARDS, startId, reduce: true, shellRef, onClose: vi.fn() }),
  )
}

const ids = (cards: { id: string }[]) => cards.map((card) => card.id)

describe('useCardBrowser — both stacks are there, whichever way the card goes', () => {
  it('holds the next cards and the previous ones at once, nearest first', () => {
    const { result } = setup()
    expect(ids(result.current.behindNext)).toEqual(['c4'])
    expect(ids(result.current.behindPrev)).toEqual(['c2', 'c1'])
  })

  it('has no previous stack on the first card, and no next on the last', () => {
    expect(ids(setup('c1').result.current.behindPrev)).toEqual([])
    expect(ids(setup('c4').result.current.behindNext)).toEqual([])
  })

  it('re-reads both stacks when a card is promoted', () => {
    const { result } = setup()
    act(() => result.current.go(-1))
    expect(result.current.index).toBe(1)
    expect(result.current.entering).toBe(true)
    expect(ids(result.current.behindNext)).toEqual(['c3', 'c4'])
    expect(ids(result.current.behindPrev)).toEqual(['c1'])
  })

  it('never re-renders from the card’s position — the stacks cross-fade instead (CODE_STYLE §12)', () => {
    let renders = 0
    const shellRef = { current: null }
    const { result } = renderHook(() => {
      renders += 1
      return useCardBrowser({
        open: true,
        cards: CARDS,
        startId: 'c3',
        reduce: true,
        shellRef,
        onClose: vi.fn(),
      })
    })
    const before = renders
    act(() => result.current.x.set(40))
    act(() => result.current.x.set(-40))
    act(() => result.current.x.set(0))
    expect(renders).toBe(before)
  })
})
