import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createRoomStore, roomsForPalace, selectRooms, type Room } from '@/entities/room'
import { createLocusStore, lociForRoom, selectLoci, type Locus } from '@/entities/locus'
import {
  createQuestionStore,
  questionsForRoom,
  selectQuestions,
  type Question,
} from '@/entities/question'
import { importRooms } from './import-rooms'

function stores() {
  const roomStore = createRoomStore(new InMemoryRepository<Room>())
  const locusStore = createLocusStore(new InMemoryRepository<Locus>())
  const questionStore = createQuestionStore(new InMemoryRepository<Question>())
  roomStore.getState().start()
  locusStore.getState().start()
  questionStore.getState().start()
  return { roomStore, locusStore, questionStore }
}

describe('importRooms', () => {
  it('creates each room in order and fills it with its cards and questions', async () => {
    const { roomStore, locusStore, questionStore } = stores()

    const result = await importRooms(roomStore, locusStore, questionStore, 'p1', [
      {
        title: 'Genesis 1',
        loci: [
          { front: '1:1', back: 'In the beginning…' },
          { front: '1:2', back: 'And the earth…' },
        ],
        questions: [{ prompt: 'Day one?', options: ['Light', 'Sea'], correctAnswer: 0 }],
      },
      { title: 'Genesis 2', loci: [{ front: '2:1', back: 'Thus the heavens…' }], questions: [] },
    ])

    expect(result).toEqual({ rooms: 2, loci: 3, questions: 1 })
    expect(roomsForPalace(selectRooms(roomStore.getState()), 'p1').map((r) => r.title)).toEqual([
      'Genesis 1',
      'Genesis 2',
    ])

    const [first, second] = roomsForPalace(selectRooms(roomStore.getState()), 'p1')
    expect(lociForRoom(selectLoci(locusStore.getState()), first!.id)).toHaveLength(2)
    expect(questionsForRoom(selectQuestions(questionStore.getState()), first!.id)).toHaveLength(1)
    expect(lociForRoom(selectLoci(locusStore.getState()), second!.id)).toHaveLength(1)
  })

  it('reports zero for an empty import', async () => {
    const { roomStore, locusStore, questionStore } = stores()
    const result = await importRooms(roomStore, locusStore, questionStore, 'p1', [])
    expect(result).toEqual({ rooms: 0, loci: 0, questions: 0 })
    expect(selectRooms(roomStore.getState())).toEqual([])
  })
})
