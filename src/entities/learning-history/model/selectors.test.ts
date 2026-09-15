import { describe, expect, it } from 'vitest'
import { historyForCard, historyOverCap } from './selectors'
import { makeHistoryEntry } from './types'
import type { HistoryEntry } from './types'

const at = (ms: number) => new Date(ms).toISOString()

const entry = (id: string, cardId: string, ms: number): HistoryEntry =>
  makeHistoryEntry({
    id,
    createdAt: at(ms),
    cardId,
    deckId: 'd1',
    kind: 'graded',
    grade: 'good',
  })

describe('historyForCard', () => {
  it('keeps only the named card’s entries, in the order it was handed them', () => {
    const entries = [entry('h1', 'c1', 2), entry('h2', 'c2', 1), entry('h3', 'c1', 0)]
    expect(historyForCard(entries, 'c1').map((each) => each.id)).toEqual(['h1', 'h3'])
  })

  it('answers with nothing for a card that has never been studied', () => {
    expect(historyForCard([entry('h1', 'c1', 0)], 'c2')).toEqual([])
  })
})

describe('historyOverCap', () => {
  it('names the oldest entries — the store holds the history newest first', () => {
    const entries = [entry('h1', 'c1', 2), entry('h2', 'c1', 1), entry('h3', 'c1', 0)]
    expect(historyOverCap(entries, 2).map((each) => each.id)).toEqual(['h3'])
  })

  it('names nothing while the history is inside its cap', () => {
    expect(historyOverCap([entry('h1', 'c1', 0)], 2)).toEqual([])
  })
})
