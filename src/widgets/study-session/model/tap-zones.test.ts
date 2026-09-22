import { describe, expect, it } from 'vitest'
import { DEFAULT_FLASHCARD_SWIPE } from '@/shared/config/flashcard-swipe'
import { resolveTap, stripWidth, zoneFor, type ZoneRect } from './tap-zones'

/** A phone-sized card: 18% of 360 is 64.8, comfortably over the fingertip floor. */
const card: ZoneRect = { left: 0, top: 0, width: 360, height: 640 }

describe('stripWidth', () => {
  it('takes a share of the shorter edge', () => {
    expect(stripWidth(card)).toBeCloseTo(64.8)
  })

  it('never goes under a fingertip on a small card', () => {
    expect(stripWidth({ left: 0, top: 0, width: 220, height: 220 })).toBe(44)
  })

  it('gives the centre half of each axis before it honours the floor', () => {
    // A quarter of 100 is 25, so the fingertip floor cannot be paid for here.
    expect(stripWidth({ left: 0, top: 0, width: 100, height: 100 })).toBe(25)
  })

  it('is never negative', () => {
    expect(stripWidth({ left: 0, top: 0, width: 0, height: 0 })).toBe(0)
  })
})

describe('zoneFor', () => {
  it('reads each edge as its direction', () => {
    expect(zoneFor({ x: 10, y: 320 }, card)).toBe('left')
    expect(zoneFor({ x: 350, y: 320 }, card)).toBe('right')
    expect(zoneFor({ x: 180, y: 10 }, card)).toBe('up')
    expect(zoneFor({ x: 180, y: 630 }, card)).toBe('down')
  })

  it('leaves the middle to the face', () => {
    expect(zoneFor({ x: 180, y: 320 }, card)).toBe('centre')
  })

  it('treats the strip edge as still inside the strip', () => {
    const strip = stripWidth(card)
    expect(zoneFor({ x: strip, y: 320 }, card)).toBe('left')
    expect(zoneFor({ x: strip + 1, y: 320 }, card)).toBe('centre')
  })

  it('gives a corner to whichever edge is nearer', () => {
    expect(zoneFor({ x: 4, y: 20 }, card)).toBe('left')
    expect(zoneFor({ x: 20, y: 4 }, card)).toBe('up')
  })

  it('gives a point outside the card to the edge it left through', () => {
    expect(zoneFor({ x: -30, y: 320 }, card)).toBe('left')
    expect(zoneFor({ x: 180, y: 900 }, card)).toBe('down')
  })

  it('reads against the position of the card, not the viewport', () => {
    const offset: ZoneRect = { left: 100, top: 200, width: 360, height: 640 }
    expect(zoneFor({ x: 110, y: 520 }, offset)).toBe('left')
    expect(zoneFor({ x: 280, y: 520 }, offset)).toBe('centre')
  })
})

describe('resolveTap', () => {
  const config = { ...DEFAULT_FLASHCARD_SWIPE.spaced, centre: 'good' as const }

  it('turns a card over from the middle while its prompt is up, whatever the centre is set to', () => {
    expect(resolveTap('centre', { showBack: false, config })).toEqual({ kind: 'flip' })
  })

  it('gives the middle of a revealed card to the action the learner set it to', () => {
    expect(resolveTap('centre', { showBack: true, config })).toEqual({
      kind: 'act',
      zone: 'centre',
    })
  })

  it('turns a revealed card back over when the centre is set to flip', () => {
    const flip = { ...config, centre: 'flip' as const }
    expect(resolveTap('centre', { showBack: true, config: flip })).toEqual({ kind: 'flip' })
  })

  it('does nothing from the middle of a revealed card left at Off', () => {
    const off = { ...config, centre: 'none' as const }
    expect(resolveTap('centre', { showBack: true, config: off })).toBeNull()
  })

  it('hands an edge over on either face', () => {
    expect(resolveTap('left', { showBack: false, config })).toEqual({ kind: 'act', zone: 'left' })
    expect(resolveTap('left', { showBack: true, config })).toEqual({ kind: 'act', zone: 'left' })
  })
})
