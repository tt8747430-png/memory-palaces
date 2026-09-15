import { describe, expect, it } from 'vitest'
import { makeHistoryEntry } from './types'

const at = (ms: number) => new Date(ms).toISOString()

const graded = {
  id: 'h1',
  createdAt: at(0),
  cardId: 'c1',
  deckId: 'd1',
  kind: 'graded' as const,
  grade: 'good' as const,
}

describe('makeHistoryEntry', () => {
  it('records a grade with the schedule it produced', () => {
    const entry = makeHistoryEntry({
      ...graded,
      intervalBefore: 1,
      intervalAfter: 3,
      dueAfter: at(3),
    })
    expect(entry).toMatchObject({ grade: 'good', intervalBefore: 1, intervalAfter: 3 })
    expect(entry.outcome).toBeUndefined()
  })

  it('is never edited, so it arrives with updatedAt already equal to createdAt', () => {
    expect(makeHistoryEntry(graded).updatedAt).toBe(at(0))
  })

  it('drops the schedule fields from a Fast answer — Fast review moves no schedule', () => {
    const entry = makeHistoryEntry({
      id: 'h1',
      createdAt: at(0),
      cardId: 'c1',
      deckId: 'd1',
      kind: 'answered',
      outcome: 'gotIt',
      intervalAfter: 99,
    })
    expect(entry.outcome).toBe('gotIt')
    expect(entry.intervalAfter).toBeUndefined()
    expect(entry.grade).toBeUndefined()
  })

  it('keeps the schedule on a Mastered mark, which has no grade behind it', () => {
    const entry = makeHistoryEntry({
      id: 'h1',
      createdAt: at(0),
      cardId: 'c1',
      deckId: 'd1',
      kind: 'mastered',
      intervalBefore: 3,
      intervalAfter: 180,
      dueAfter: at(180),
    })
    expect(entry).toMatchObject({ kind: 'mastered', intervalBefore: 3, intervalAfter: 180 })
    expect(entry.grade).toBeUndefined()
    expect(entry.outcome).toBeUndefined()
  })

  it('never defaults intervalBefore — absent is what says the card had no schedule yet', () => {
    expect(makeHistoryEntry(graded).intervalBefore).toBeUndefined()
    expect(makeHistoryEntry({ ...graded, intervalBefore: 0 }).intervalBefore).toBe(0)
  })

  it('refuses an entry that belongs to no card or no deck', () => {
    expect(() => makeHistoryEntry({ ...graded, cardId: '' })).toThrow(/card/i)
    expect(() => makeHistoryEntry({ ...graded, deckId: '' })).toThrow(/deck/i)
  })

  it('refuses an answer that does not say what the learner answered', () => {
    expect(() => makeHistoryEntry({ ...graded, grade: undefined })).toThrow(/grade/i)
    expect(() => makeHistoryEntry({ ...graded, kind: 'answered', grade: undefined })).toThrow(
      /outcome/i,
    )
  })
})
