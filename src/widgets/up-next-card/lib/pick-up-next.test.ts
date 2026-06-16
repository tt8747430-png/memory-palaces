import { describe, expect, it } from 'vitest'
import type { SrsState } from '@/shared/lib'
import {
  pickUpNextRooms,
  type UpNextLocus,
  type UpNextPalace,
  type UpNextRoomInput,
} from './pick-up-next'

const NOW = Date.UTC(2026, 0, 10)
const DAY = 86_400_000
const iso = (ms: number) => new Date(ms).toISOString()

const srs = (over: Partial<SrsState> = {}): SrsState => ({
  due: iso(NOW),
  interval: 1,
  ease: 2.5,
  reps: 1,
  lapses: 0,
  lastReviewed: iso(NOW),
  ...over,
})

const palace = (id: string, over: Partial<UpNextPalace> = {}): UpNextPalace => ({
  id,
  name: id,
  icon: '🏛️',
  ...over,
})
const room = (id: string, palaceId: string, order = 0): UpNextRoomInput => ({
  id,
  palaceId,
  title: id,
  order,
})
const locus = (id: string, roomId: string, s?: SrsState): UpNextLocus => ({ id, roomId, srs: s })

describe('pickUpNextRooms', () => {
  it('skips empty rooms and rooms of archived palaces', () => {
    const palaces = [palace('p'), palace('arch', { archived: true })]
    const rooms = [room('empty', 'p'), room('archived', 'arch')]
    const loci = [locus('l', 'archived', srs())]
    expect(pickUpNextRooms(palaces, rooms, loci, NOW)).toEqual([])
  })

  it('skips fully-mastered rooms with nothing due', () => {
    const known = srs({ due: iso(NOW + 30 * DAY), interval: 30, reps: 6 })
    expect(
      pickUpNextRooms([palace('p')], [room('r', 'p')], [locus('l', 'r', known)], NOW),
    ).toEqual([])
  })

  it('prioritizes review-due rooms, then in-progress, then not-started', () => {
    const palaces = [palace('p')]
    const rooms = [room('due', 'p'), room('prog', 'p'), room('fresh', 'p')]
    const overdue = srs({ due: iso(NOW - DAY), reps: 2 })
    const notDue = srs({ due: iso(NOW + 5 * DAY), interval: 5, reps: 2 })
    const loci = [
      locus('d', 'due', overdue),
      locus('p', 'prog', notDue),
      locus('f', 'fresh'), // never studied
    ]

    const result = pickUpNextRooms(palaces, rooms, loci, NOW)

    expect(result.map((r) => r.roomId)).toEqual(['due', 'prog', 'fresh'])
    expect(result.map((r) => r.bucket)).toEqual([0, 1, 2])
    expect(result[0]!.due).toBe(1)
  })

  it('caps the list at the limit', () => {
    const palaces = [palace('p')]
    const rooms = Array.from({ length: 5 }, (_, i) => room(`r${i}`, 'p'))
    const loci = rooms.map((r, i) => locus(`l${i}`, r.id, srs({ due: iso(NOW - DAY), reps: 2 })))
    expect(pickUpNextRooms(palaces, rooms, loci, NOW)).toHaveLength(3)
  })
})
