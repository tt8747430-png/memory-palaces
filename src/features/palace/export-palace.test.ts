import { describe, expect, it } from 'vitest'
import { makePalace, type Palace } from '@/entities/palace'
import { makeRoom, type Room } from '@/entities/room'
import { makeLocus, type Locus } from '@/entities/locus'
import { makeQuestion, type Question } from '@/entities/question'
import { exportPalaceAnki, exportPalaceJson } from './export-palace'

const at = (ms: number) => new Date(ms).toISOString()

const palace: Palace = makePalace({ id: 'p1', createdAt: at(0), name: 'Roman Forum' })
const rooms: Room[] = [
  makeRoom({ id: 'r2', createdAt: at(0), palaceId: 'p1', title: 'Second', order: 1 }),
  makeRoom({ id: 'r1', createdAt: at(0), palaceId: 'p1', title: 'First', order: 0 }),
  makeRoom({ id: 'rx', createdAt: at(0), palaceId: 'other', title: 'Elsewhere', order: 0 }),
]
const loci: Locus[] = [
  makeLocus({ id: 'l1', createdAt: at(0), roomId: 'r1', front: 'Mihi', back: 'to me', order: 0 }),
  makeLocus({ id: 'l2', createdAt: at(0), roomId: 'r2', front: 'Tibi', back: 'to you', order: 0 }),
  makeLocus({ id: 'lx', createdAt: at(0), roomId: 'other', front: 'Nope', back: 'x', order: 0 }),
]
const questions: Question[] = [
  makeQuestion({
    id: 'q1',
    createdAt: at(0),
    roomId: 'r1',
    prompt: 'Mihi?',
    options: ['to me', 'to you'],
    correctAnswer: 0,
    order: 0,
  }),
]

describe('exportPalaceJson', () => {
  it('serializes only this palace, rooms in order, with their loci and questions', () => {
    const file = exportPalaceJson(palace, rooms, loci, questions)
    expect(file.filename).toBe('roman-forum.mindscape.json')
    expect(file.type).toBe('application/json')

    const parsed = JSON.parse(file.text)
    expect(parsed.palace.name).toBe('Roman Forum')
    expect(parsed.rooms.map((room: { title: string }) => room.title)).toEqual(['First', 'Second'])
    expect(parsed.rooms[0].loci).toEqual([
      { front: 'Mihi', back: 'to me', hint: undefined, tip: undefined },
    ])
    expect(parsed.rooms[0].questions[0].prompt).toBe('Mihi?')
  })
})

describe('exportPalaceAnki', () => {
  it('flattens the palace cards into Anki notes, skipping other palaces', () => {
    const file = exportPalaceAnki(palace, rooms, loci)
    expect(file.filename).toBe('roman-forum.anki.txt')
    expect(file.text).toContain('Mihi\tto me')
    expect(file.text).toContain('Tibi\tto you')
    expect(file.text).not.toContain('Nope')
  })
})
