import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { schedule } from '@/shared/lib'
import { createRoomStore, type Room, roomsForPalace, selectRooms } from '@/entities/room'
import { createLocusStore, lociForRoom, type Locus, selectLoci } from '@/entities/locus'
import {
  createQuestionStore,
  type Question,
  questionsForRoom,
  selectQuestions,
} from '@/entities/question'
import { createLocus } from '@/features/locus/create-locus'
import { editLocus } from '@/features/locus/edit-locus'
import { createQuestion } from '@/features/question/create-question'
import { createRoom } from './create-room'
import { duplicateRoom } from './duplicate-room'

function stores() {
  const roomStore = createRoomStore(new InMemoryRepository<Room>())
  const locusStore = createLocusStore(new InMemoryRepository<Locus>())
  const questionStore = createQuestionStore(new InMemoryRepository<Question>())
  roomStore.getState().start()
  locusStore.getState().start()
  questionStore.getState().start()
  return { roomStore, locusStore, questionStore }
}

describe('duplicateRoom', () => {
  it('deep-copies the room with its loci and questions, appended to the palace', async () => {
    const { roomStore, locusStore, questionStore } = stores()
    await createRoom(roomStore, 'p1', { title: 'First' })
    const source = await createRoom(roomStore, 'p1', { title: 'Atrium', description: 'Busts' })

    const card = await createLocus(locusStore, source.id, { front: 'Mihi', back: 'to me' })
    await createLocus(locusStore, source.id, { front: 'Tibi', back: 'to you' })
    await createQuestion(questionStore, source.id, {
      prompt: 'Mihi?',
      options: ['to me', 'to you'],
      correctAnswer: 0,
    })

    const copy = await duplicateRoom(roomStore, locusStore, questionStore, source.id)

    expect(copy.title).toBe('Atrium (copy)')
    expect(copy.palaceId).toBe('p1')
    expect(copy.id).not.toBe(source.id)
    // Appended after First(0) and Atrium(1).
    expect(copy.order).toBe(2)
    expect(roomsForPalace(selectRooms(roomStore.getState()), 'p1').map((r) => r.title)).toEqual([
      'First',
      'Atrium',
      'Atrium (copy)',
    ])

    const copiedLoci = lociForRoom(selectLoci(locusStore.getState()), copy.id)
    expect(copiedLoci.map((l) => [l.front, l.back])).toEqual([
      ['Mihi', 'to me'],
      ['Tibi', 'to you'],
    ])
    expect(copiedLoci.every((l) => l.id !== card.id)).toBe(true)

    const copiedQuestions = questionsForRoom(selectQuestions(questionStore.getState()), copy.id)
    expect(copiedQuestions).toHaveLength(1)
    expect(copiedQuestions[0]?.prompt).toBe('Mihi?')
  })

  it('copies content but not the schedule or flags (a fresh deck to learn)', async () => {
    const { roomStore, locusStore, questionStore } = stores()
    const source = await createRoom(roomStore, 'p1', { title: 'Source' })
    const card = await createLocus(locusStore, source.id, { front: 'a', back: 'b' })
    await editLocus(locusStore, card.id, {
      flagged: true,
      srs: schedule(undefined, 'good', Date.UTC(2026, 0, 1)),
    })

    const copy = await duplicateRoom(roomStore, locusStore, questionStore, source.id)

    const copied = lociForRoom(selectLoci(locusStore.getState()), copy.id)[0]
    expect(copied?.srs).toBeUndefined()
    expect(copied?.flagged).toBe(false)
  })

  it('throws when the room does not exist', async () => {
    const { roomStore, locusStore, questionStore } = stores()
    await expect(duplicateRoom(roomStore, locusStore, questionStore, 'nope')).rejects.toThrow(
      /not found/i,
    )
  })
})
