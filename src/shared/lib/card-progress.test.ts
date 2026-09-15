import { describe, expect, it } from 'vitest'
import {
  draftDiffersFromCard,
  draftFrom,
  draftSchedule,
  draftStatus,
  gradePreview,
  withDue,
  withGrade,
  withStatus,
} from './card-progress'
import { DAY_MS } from './clock'
import { schedule, type SrsState } from './srs'

const NOW = Date.parse('2026-09-15T09:00:00.000Z')

const studied = (): SrsState => schedule(undefined, 'good', NOW)
const draft = (srs?: SrsState) => draftFrom(srs, NOW)

describe('card progress draft', () => {
  it('starts as the card, with nothing to apply', () => {
    const start = draft(studied())
    expect(draftDiffersFromCard(start)).toBe(false)
    expect(start.grade).toBeUndefined()
  })

  it('replaces rather than compounds when the same grade is tapped twice', () => {
    const once = withGrade(draft(), 'good')
    const twice = withGrade(once, 'good')
    expect(draftSchedule(twice)?.interval).toBe(draftSchedule(once)?.interval)
  })

  it('remembers the grade so the write is recorded as an answer', () => {
    expect(withGrade(draft(), 'hard').grade).toBe('hard')
  })

  it('lands each status where srsStatus reads it back', () => {
    const start = draft(studied())
    expect(draftStatus(withStatus(start, 'new'))).toBe('new')
    expect(draftStatus(withStatus(start, 'learning'))).toBe('learning')
    expect(draftStatus(withStatus(start, 'known'))).toBe('known')
  })

  it('clears the schedule for new', () => {
    expect(draftSchedule(withStatus(draft(studied()), 'new'))).toBeUndefined()
  })

  it('keeps ease and lapses when it moves a card to learning', () => {
    const lapsed = schedule(schedule(undefined, 'good', NOW), 'again', NOW)
    const shaped = draftSchedule(withStatus(draft(lapsed), 'learning'))
    expect(shaped?.ease).toBe(lapsed.ease)
    expect(shaped?.lapses).toBe(lapsed.lapses)
  })

  it('sets the due date a picked day away', () => {
    const shaped = draftSchedule(withDue(draft(studied()), NOW + 10 * DAY_MS))
    expect(shaped?.interval).toBe(10)
    expect(shaped?.due).toBe(new Date(NOW + 10 * DAY_MS).toISOString())
  })

  it('grades on top of a status the learner set', () => {
    const learning = withStatus(draft(studied()), 'learning')
    const graded = withGrade(learning, 'good')
    expect(draftSchedule(graded)).toEqual(schedule(draftSchedule(learning), 'good', NOW))
  })

  it('keeps the grade folded in when the card is shaped afterwards', () => {
    const graded = withGrade(draft(), 'easy')
    const moved = withDue(graded, NOW + 4 * DAY_MS)
    expect(moved.grade).toBeUndefined()
    expect(draftSchedule(moved)?.ease).toBe(draftSchedule(graded)?.ease)
    expect(draftSchedule(moved)?.reps).toBe(draftSchedule(graded)?.reps)
    expect(draftSchedule(moved)?.interval).toBe(4)
  })

  it('previews a grade against the draft on screen, not the stored card', () => {
    const known = withStatus(draft(), 'known')
    expect(gradePreview(known, 'good').interval).toBeGreaterThan(
      gradePreview(draft(), 'good').interval,
    )
  })

  it('reports a real move only when the schedule changed', () => {
    const card = studied()
    expect(draftDiffersFromCard(withDue(draft(card), Date.parse(card.due)))).toBe(false)
    expect(draftDiffersFromCard(withStatus(draft(card), 'known'))).toBe(true)
    expect(draftDiffersFromCard(withStatus(draft(), 'new'))).toBe(false)
  })
})
