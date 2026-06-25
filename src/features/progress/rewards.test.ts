import { describe, expect, it } from 'vitest'
import { outcomeToReward, studyXp, quizXp, XP_MATCH, XP_VERSE } from './rewards'

describe('outcomeToReward', () => {
  it('maps a study outcome to xp by cards graded, items = graded', () => {
    expect(outcomeToReward({ kind: 'study', graded: 8 })).toEqual({
      xp: studyXp(8),
      itemsPracticed: 8,
    })
  })

  it('maps a quiz outcome to xp by correct, items = total, and carries accuracy', () => {
    expect(outcomeToReward({ kind: 'quiz', correct: 7, total: 10, accuracy: 70 })).toEqual({
      xp: quizXp(7),
      itemsPracticed: 10,
      quizAccuracy: 70,
    })
  })

  it('maps a match outcome to the flat win xp, items = pairs', () => {
    expect(outcomeToReward({ kind: 'match', pairs: 6 })).toEqual({
      xp: XP_MATCH,
      itemsPracticed: 6,
    })
  })

  it('maps a verse outcome to xp and items scaled by verses memorized', () => {
    expect(outcomeToReward({ kind: 'verse', memorized: 1 })).toEqual({
      xp: XP_VERSE,
      itemsPracticed: 1,
    })
  })
})
