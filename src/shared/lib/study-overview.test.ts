import { describe, expect, it } from 'vitest'
import { schedule, type SrsState } from './srs'
import { fastOverview, studyOverview } from './study-overview'

const NOW = Date.UTC(2026, 0, 10)

const notDue = (): { srs: SrsState } => ({ srs: schedule(undefined, 'good', NOW) })
const newDue = (): { srs?: SrsState } => ({})
const dueAgain = (): { srs: SrsState } => ({ srs: schedule(undefined, 'again', NOW) })

describe('studyOverview', () => {
  it('counts only the due cards and splits that set by maturity', () => {
    const overview = studyOverview([newDue(), dueAgain(), notDue()], NOW)
    expect(overview.count).toBe(2)
    expect(overview.breakdown).toEqual({ new: 2, learning: 0, known: 0 })
    expect(overview.isCaughtUp).toBe(false)
  })

  it('reports caught-up when nothing is due', () => {
    const overview = studyOverview([notDue(), notDue()], NOW)
    expect(overview.count).toBe(0)
    expect(overview.breakdown).toEqual({ new: 0, learning: 0, known: 0 })
    expect(overview.isCaughtUp).toBe(true)
  })

  it('is caught-up on an empty scope', () => {
    expect(studyOverview([], NOW).isCaughtUp).toBe(true)
  })
})

describe('studyOverview frozen cards', () => {
  it('never counts a frozen card as due', () => {
    const due = { srs: undefined }
    expect(studyOverview([due, { srs: undefined, frozen: true }], NOW).count).toBe(1)
  })
})

describe('fastOverview', () => {
  it('counts the three buckets', () => {
    const cards = [{}, { fastReview: 'notQuite' as const }, { fastReview: 'gotIt' as const }]
    expect(fastOverview(cards, 3000).breakdown).toEqual({ notStudied: 1, notQuite: 1, gotIt: 1 })
  })

  it('offers no more than the daily maximum', () => {
    const cards = Array.from({ length: 10 }, () => ({}))
    expect(fastOverview(cards, 4).count).toBe(4)
  })

  it('never counts a frozen card', () => {
    expect(fastOverview([{ frozen: true }, {}], 3000).count).toBe(1)
  })
})
