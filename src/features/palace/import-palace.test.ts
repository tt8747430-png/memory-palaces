import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { parsePalaceContent } from '@/shared/lib'
import { createPalaceStore, makePalace, selectPalaces, type Palace } from '@/entities/palace'
import { createRoomStore, makeRoom, roomsForPalace, selectRooms, type Room } from '@/entities/room'
import { createLocusStore, lociForRoom, makeLocus, selectLoci, type Locus } from '@/entities/locus'
import { createQuestionStore, makeQuestion, type Question } from '@/entities/question'
import { exportPalaceJson } from './export-palace'
import { importPalace } from './import-palace'

const at = (ms: number) => new Date(ms).toISOString()

describe('importPalace (round-trips a palace export)', () => {
  it('recreates the palace, its identity, and all rooms with content under fresh ids', async () => {
    const source = makePalace({ id: 'src', createdAt: at(0), name: 'Roman Forum', bibleMode: true })
    const rooms: Room[] = [
      makeRoom({ id: 'r1', createdAt: at(0), palaceId: 'src', title: 'Entrance', order: 0 }),
      makeRoom({ id: 'r2', createdAt: at(0), palaceId: 'src', title: 'Atrium', order: 1 }),
    ]
    const loci: Locus[] = [
      makeLocus({ id: 'l1', createdAt: at(0), roomId: 'r1', front: 'Mihi', back: 'to me', order: 0 }),
      makeLocus({ id: 'l2', createdAt: at(0), roomId: 'r2', front: 'Tibi', back: 'to you', order: 0 }),
    ]
    const questions: Question[] = [
      makeQuestion({ id: 'q1', createdAt: at(0), roomId: 'r1', prompt: 'Mihi?', options: ['to me', 'to you'], correctAnswer: 0, order: 0 }),
    ]

    const file = exportPalaceJson(source, rooms, loci, questions)
    const parsed = parsePalaceContent(file.text)

    const palaceStore = createPalaceStore(new InMemoryRepository<Palace>())
    const roomStore = createRoomStore(new InMemoryRepository<Room>())
    const locusStore = createLocusStore(new InMemoryRepository<Locus>())
    const questionStore = createQuestionStore(new InMemoryRepository<Question>())
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
    questionStore.getState().start()

    const result = await importPalace(palaceStore, roomStore, locusStore, questionStore, parsed)

    expect(result.rooms).toBe(2)
    expect(result.loci).toBe(2)
    expect(result.questions).toBe(1)
    expect(result.palace.id).not.toBe('src')

    const imported = selectPalaces(palaceStore.getState())
    expect(imported).toHaveLength(1)
    expect(imported[0]?.name).toBe('Roman Forum')
    expect(imported[0]?.bibleMode).toBe(true)

    const newRooms = roomsForPalace(selectRooms(roomStore.getState()), result.palace.id)
    expect(newRooms.map((r) => r.title)).toEqual(['Entrance', 'Atrium'])
    expect(lociForRoom(selectLoci(locusStore.getState()), newRooms[0]!.id)[0]?.front).toBe('Mihi')
  })

  it('rejects a file that isn’t a palace export', () => {
    expect(() => parsePalaceContent('{"type":"something-else"}')).toThrow(/palace export/i)
  })
})
