import { describe, expect, it } from 'vitest'
import {
  isLocusReviewed,
  isRoomCompleted,
  isRoomUnlocked,
  levelFromXp,
  palaceProgress,
  roomProgress,
} from './stats'
import type { SrsState } from './srs'

const reviewed: { srs?: SrsState } = {
  srs: { due: '', interval: 1, ease: 2.5, reps: 2, lapses: 0, lastReviewed: '' },
}
const fresh: { srs?: SrsState } = {}

describe('levelFromXp', () => {
  it('maps xp onto 250-xp levels', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, xpInLevel: 0, xpForNextLevel: 250 })
    expect(levelFromXp(250)).toEqual({ level: 2, xpInLevel: 0, xpForNextLevel: 250 })
    expect(levelFromXp(600)).toEqual({ level: 3, xpInLevel: 100, xpForNextLevel: 250 })
  })
})

describe('isLocusReviewed', () => {
  it('is true once a locus has at least one rep', () => {
    expect(isLocusReviewed(reviewed)).toBe(true)
    expect(isLocusReviewed(fresh)).toBe(false)
  })
})

describe('roomProgress', () => {
  it('is 0 for an empty room', () => {
    expect(roomProgress([])).toBe(0)
  })

  it('is the percentage of reviewed loci', () => {
    expect(roomProgress([reviewed, fresh])).toBe(50)
    expect(roomProgress([reviewed, reviewed])).toBe(100)
  })
})

describe('isRoomCompleted', () => {
  it('is false for an empty room and true only when every locus is reviewed', () => {
    expect(isRoomCompleted([])).toBe(false)
    expect(isRoomCompleted([reviewed, fresh])).toBe(false)
    expect(isRoomCompleted([reviewed, reviewed])).toBe(true)
  })
})

describe('palaceProgress', () => {
  it('is the percentage of completed rooms', () => {
    expect(palaceProgress([])).toBe(0)
    expect(palaceProgress([true, false])).toBe(50)
    expect(palaceProgress([true, true])).toBe(100)
  })
})

describe('isRoomUnlocked', () => {
  it('always unlocks the first room', () => {
    expect(isRoomUnlocked(0, [false, false])).toBe(true)
  })

  it('unlocks a later room only when the previous one is complete', () => {
    expect(isRoomUnlocked(1, [true, false])).toBe(true)
    expect(isRoomUnlocked(1, [false, false])).toBe(false)
  })
})
