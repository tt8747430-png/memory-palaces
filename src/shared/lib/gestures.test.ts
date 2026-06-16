import { describe, expect, it } from 'vitest'
import {
  clampSwipeOffset,
  pullDistance,
  PULL_REFRESH_MAX,
  PULL_REFRESH_THRESHOLD,
  shouldCommitSwipe,
  shouldRefresh,
  SWIPE_DELETE_MAX,
  SWIPE_DELETE_THRESHOLD,
} from './gestures'

describe('clampSwipeOffset', () => {
  it('rubber-bands a rightward (wrong-way) drag', () => {
    expect(clampSwipeOffset(100)).toBeCloseTo(18)
  })

  it('passes a leftward drag through within the cap', () => {
    expect(clampSwipeOffset(-50)).toBe(-50)
  })

  it('caps the leftward travel at the reveal width', () => {
    expect(clampSwipeOffset(-400)).toBe(-SWIPE_DELETE_MAX)
  })
})

describe('shouldCommitSwipe', () => {
  it('never commits a rightward drag', () => {
    expect(shouldCommitSwipe(80, 2)).toBe(false)
  })

  it('commits once the leftward drag clears the threshold', () => {
    expect(shouldCommitSwipe(-SWIPE_DELETE_THRESHOLD, 0)).toBe(true)
    expect(shouldCommitSwipe(-(SWIPE_DELETE_THRESHOLD - 1), 0)).toBe(false)
  })

  it('commits a short but fast left fling', () => {
    expect(shouldCommitSwipe(-20, 0.6)).toBe(true)
    expect(shouldCommitSwipe(-20, 0.4)).toBe(false)
  })
})

describe('pullDistance', () => {
  it('is zero for an upward or flat drag', () => {
    expect(pullDistance(-30)).toBe(0)
    expect(pullDistance(0)).toBe(0)
  })

  it('applies elastic resistance and caps at the max', () => {
    expect(pullDistance(100)).toBe(50)
    expect(pullDistance(1000)).toBe(PULL_REFRESH_MAX)
  })
})

describe('shouldRefresh', () => {
  it('triggers only past the threshold', () => {
    expect(shouldRefresh(PULL_REFRESH_THRESHOLD)).toBe(true)
    expect(shouldRefresh(PULL_REFRESH_THRESHOLD - 1)).toBe(false)
  })
})
