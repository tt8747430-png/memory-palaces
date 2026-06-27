import { describe, expect, it } from 'vitest'
import {
  countDueLoci,
  countDuePerPalace,
  getDueLoci,
  type DueLocus,
  type DuePalace,
  type DueRoom,
} from './dueCards'
import { schedule } from './srs'

const DAY_MS = 86_400_000
const NOW = Date.UTC(2026, 0, 1)

const palaces: DuePalace[] = [
  { id: 'p1', name: 'Spanish' },
  { id: 'p2', name: 'Archived', archived: true },
]
const rooms: DueRoom[] = [
  { id: 'r1', palaceId: 'p1', title: 'Kitchen' },
  { id: 'r2', palaceId: 'p2', title: 'Attic' },
]

describe('getDueLoci', () => {
  it('includes brand-new loci and resolves their palace/room context', () => {
    const loci: DueLocus[] = [{ id: 'l1', roomId: 'r1' }]
    const due = getDueLoci(palaces, rooms, loci, NOW)
    expect(due).toHaveLength(1)
    expect(due[0]).toMatchObject({ palaceId: 'p1', palaceName: 'Spanish', roomId: 'r1', roomTitle: 'Kitchen' })
  })

  it('excludes loci that are scheduled for the future', () => {
    const notYet: DueLocus = { id: 'l1', roomId: 'r1', srs: schedule(undefined, 'good', NOW) }
    expect(getDueLoci(palaces, rooms, [notYet], NOW)).toHaveLength(0)
    expect(getDueLoci(palaces, rooms, [notYet], NOW + DAY_MS)).toHaveLength(1)
  })

  it('excludes loci in archived palaces', () => {
    const loci: DueLocus[] = [{ id: 'l2', roomId: 'r2' }]
    expect(getDueLoci(palaces, rooms, loci, NOW)).toHaveLength(0)
  })

  it('excludes loci whose room or palace is missing', () => {
    const orphan: DueLocus[] = [{ id: 'l3', roomId: 'ghost' }]
    expect(getDueLoci(palaces, rooms, orphan, NOW)).toHaveLength(0)
  })
})

describe('countDueLoci', () => {
  it('counts the due queue', () => {
    const loci: DueLocus[] = [
      { id: 'l1', roomId: 'r1' },
      { id: 'l2', roomId: 'r2' }, // archived → excluded
    ]
    expect(countDueLoci(palaces, rooms, loci, NOW)).toBe(1)
  })
})

describe('countDuePerPalace', () => {
  it('tallies due cards per palace and omits palaces with nothing due', () => {
    const loci: DueLocus[] = [
      { id: 'l1', roomId: 'r1' },
      { id: 'l1b', roomId: 'r1' },
      { id: 'l2', roomId: 'r2' }, // archived palace → excluded
    ]
    const counts = countDuePerPalace(palaces, rooms, loci, NOW)
    expect(counts.get('p1')).toBe(2)
    expect(counts.has('p2')).toBe(false)
  })
})
