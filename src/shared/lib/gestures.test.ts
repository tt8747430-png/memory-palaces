import { describe, expect, it } from 'vitest'
import {
  armedSide,
  clampSwipeOffset,
  dragFrame,
  type FlingThresholds,
  resolveFling,
  resolveSwipeRelease,
  resolveThrow,
  type SwipeGeometry,
  wasCanceled,
} from './gestures'

const geo: SwipeGeometry = {
  hasLeading: true,
  hasTrailing: true,
  leadingWidth: 60,
  trailingWidth: 120,
  leadingCommit: 124,
  trailingCommit: 184,
}

const trailingOnly: SwipeGeometry = { ...geo, hasLeading: false }

describe('clampSwipeOffset', () => {
  it('passes travel through up to each commit point', () => {
    expect(clampSwipeOffset(80, geo)).toBe(80)
    expect(clampSwipeOffset(-150, geo)).toBe(-150)
  })

  it('rubber-bands past the commit point (0.35 resistance)', () => {
    expect(clampSwipeOffset(224, geo)).toBeCloseTo(124 + 100 * 0.35)
    expect(clampSwipeOffset(-284, geo)).toBeCloseTo(-(184 + 100 * 0.35))
  })

  it('softly damps a drag against an absent tray (0.12)', () => {
    expect(clampSwipeOffset(100, trailingOnly)).toBeCloseTo(12)
  })
})

describe('armedSide', () => {
  it('arms an edge only once its commit point is cleared', () => {
    expect(armedSide(-183, geo)).toBeNull()
    expect(armedSide(-184, geo)).toBe('trailing')
    expect(armedSide(124, geo)).toBe('leading')
    expect(armedSide(123, geo)).toBeNull()
  })

  it('never arms a side that has no tray', () => {
    expect(armedSide(200, trailingOnly)).toBeNull()
  })
})

describe('resolveSwipeRelease', () => {
  it('commits the edge action past the commit point', () => {
    expect(resolveSwipeRelease(-184, geo)).toEqual({ kind: 'commit-trailing' })
    expect(resolveSwipeRelease(124, geo)).toEqual({ kind: 'commit-leading' })
  })

  it('opens the tray past half its reveal width', () => {
    expect(resolveSwipeRelease(-70, geo)).toEqual({ kind: 'open-trailing', settleTo: -120 })
    expect(resolveSwipeRelease(40, geo)).toEqual({ kind: 'open-leading', settleTo: 60 })
  })

  it('snaps closed below the open threshold', () => {
    expect(resolveSwipeRelease(-30, geo)).toEqual({ kind: 'close', settleTo: 0 })
    expect(resolveSwipeRelease(20, geo)).toEqual({ kind: 'close', settleTo: 0 })
  })
})

describe('wasCanceled', () => {
  it('tells a gesture the platform took away from one the learner released', () => {
    expect(wasCanceled(new Event('pointercancel'))).toBe(true)
    expect(wasCanceled(new Event('touchcancel'))).toBe(true)
    expect(wasCanceled(new Event('pointerup'))).toBe(false)
    expect(wasCanceled(undefined)).toBe(false)
  })
})

describe('resolveFling', () => {
  const throwIt: FlingThresholds = { distance: 80, speed: 0.5 }

  it('counts travel past the distance however slowly it was made', () => {
    expect(resolveFling(-80, 0, 0, throwIt)).toBe(-1)
    expect(resolveFling(80, 0, 0, throwIt)).toBe(1)
  })

  it('counts a short throw that was fast enough, in the direction it went', () => {
    expect(resolveFling(-30, 0.6, -1, throwIt)).toBe(-1)
    expect(resolveFling(30, 0.6, 1, throwIt)).toBe(1)
  })

  it('is neither, below both bars', () => {
    expect(resolveFling(-30, 0.4, -1, throwIt)).toBe(0)
    expect(resolveFling(79, 0.49, 1, throwIt)).toBe(0)
  })

  it('does not lend one axis another axis speed', () => {
    expect(resolveFling(4, 0.9, 0, throwIt)).toBe(0)
  })
})

describe('dragFrame', () => {
  const released = new Event('pointerup')

  it('calls a frame that has not ended a move', () => {
    expect(dragFrame({ tap: false, last: false, event: released })).toBe('moving')
  })

  it('calls a lift a release and a cancel its own thing', () => {
    expect(dragFrame({ tap: false, last: true, event: released })).toBe('released')
    expect(dragFrame({ tap: false, last: true, event: new Event('pointercancel') })).toBe(
      'canceled',
    )
  })

  it('calls a tap a tap however it ended', () => {
    expect(dragFrame({ tap: true, last: true, event: new Event('pointercancel') })).toBe('tap')
  })
})

describe('resolveThrow', () => {
  const throwIt: FlingThresholds = { distance: 80, speed: 0.5 }
  const still = { velocity: [0, 0], direction: [0, 0] } as const

  it('is null for a drag that was no throw', () => {
    expect(resolveThrow({ movement: [20, 10], ...still }, throwIt)).toBeNull()
  })

  it('takes the axis the finger went furthest along', () => {
    expect(resolveThrow({ movement: [-90, 200], ...still }, throwIt)).toEqual({
      axis: 'y',
      sign: 1,
    })
    expect(resolveThrow({ movement: [-200, 90], ...still }, throwIt)).toEqual({
      axis: 'x',
      sign: -1,
    })
  })

  it('keeps a tie on x', () => {
    expect(resolveThrow({ movement: [100, -100], ...still }, throwIt)).toEqual({
      axis: 'x',
      sign: 1,
    })
  })

  it('refuses a locked-axis throw that wandered further across the axis than along it', () => {
    const scroll = { movement: [-90, 400], ...still, lockedTo: 'x' } as const
    expect(resolveThrow(scroll, throwIt)).toBeNull()
    expect(resolveThrow({ ...scroll, movement: [-90, 40] }, throwIt)).toEqual({
      axis: 'x',
      sign: -1,
    })
  })

  it('never answers with the axis the surface is locked out of', () => {
    expect(resolveThrow({ movement: [0, 300], ...still, lockedTo: 'x' }, throwIt)).toBeNull()
  })
})
