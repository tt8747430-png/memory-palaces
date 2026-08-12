import { describe, expect, it } from 'vitest'
import type { Card } from '@/entities/card'
import { mergeCard } from './merge-srs'

const card = (over: Partial<Card>): Card => ({
  id: 'c1',
  createdAt: 't0',
  updatedAt: 't1',
  deckId: 'd1',
  front: 'F',
  back: 'B',
  flagged: false,
  memorized: false,
  order: 0,
  ...over,
})

describe('mergeCard', () => {
  it('keeps max reps/lapses and the newest review state', () => {
    const local = card({
      updatedAt: 't3',
      srs: {
        due: '2026-07-25',
        interval: 4,
        ease: 2.4,
        reps: 5,
        lapses: 1,
        lastReviewed: '2026-07-21',
      },
    })
    const remote = card({
      updatedAt: 't2',
      front: 'other',
      srs: {
        due: '2026-07-24',
        interval: 3,
        ease: 2.5,
        reps: 6,
        lapses: 2,
        lastReviewed: '2026-07-20',
      },
    })

    const merged = mergeCard(local, remote)

    expect(merged.srs?.due).toBe('2026-07-25')
    expect(merged.srs?.reps).toBe(6)
    expect(merged.srs?.lapses).toBe(2)
    expect(merged.front).toBe('F')
  })

  it('returns the defined srs when only one side has been reviewed', () => {
    const local = card({ updatedAt: 't2' })
    const remote = card({
      updatedAt: 't1',
      srs: { due: 'd', interval: 1, ease: 2.5, reps: 1, lapses: 0, lastReviewed: 'r' },
    })

    expect(mergeCard(local, remote).srs?.reps).toBe(1)
  })

  it('leaves an unreviewed card without srs', () => {
    expect(mergeCard(card({ updatedAt: 't2' }), card({ updatedAt: 't1' })).srs).toBeUndefined()
  })

  it('is symmetric', () => {
    const local = card({
      updatedAt: 't3',
      srs: { due: 'd2', interval: 4, ease: 2.4, reps: 5, lapses: 1, lastReviewed: '2026-07-21' },
    })
    const remote = card({
      updatedAt: 't2',
      srs: { due: 'd1', interval: 3, ease: 2.5, reps: 6, lapses: 2, lastReviewed: '2026-07-20' },
    })

    expect(mergeCard(local, remote)).toEqual(mergeCard(remote, local))
  })
})
