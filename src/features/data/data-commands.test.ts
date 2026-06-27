import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, makePalace, type Palace } from '@/entities/palace'
import { createRoomStore, makeRoom, type Room } from '@/entities/room'
import { createLocusStore, type Locus, makeLocus } from '@/entities/locus'
import { createQuestionStore, makeQuestion, type Question } from '@/entities/question'
import { createProgressStore, makeProgress, type Progress } from '@/entities/progress'
import {
  type AppNotification,
  createNotificationStore,
  makeNotification,
} from '@/entities/notification'
import { PROGRESS_ID } from '@/features/progress'
import { clearAllContent, clearNotifications, resetEverything, resetProgress } from './index'

const at = (ms: number) => new Date(ms).toISOString()
const NOW = Date.UTC(2026, 0, 1)

function contentStores() {
  const palaceStore = createPalaceStore(
    new InMemoryRepository<Palace>([makePalace({ id: 'p1', createdAt: at(0), name: 'Home' })]),
  )
  const roomStore = createRoomStore(
    new InMemoryRepository<Room>([
      makeRoom({ id: 'r1', createdAt: at(0), palaceId: 'p1', title: 'Hall', order: 0 }),
    ]),
  )
  const locusStore = createLocusStore(
    new InMemoryRepository<Locus>([
      makeLocus({ id: 'l1', createdAt: at(0), roomId: 'r1', front: 'a', back: 'b' }),
    ]),
  )
  const questionStore = createQuestionStore(
    new InMemoryRepository<Question>([
      makeQuestion({
        id: 'q1',
        createdAt: at(0),
        roomId: 'r1',
        prompt: '?',
        options: ['a', 'b'],
        correctAnswer: 0,
      }),
    ]),
  )
  for (const store of [palaceStore, roomStore, locusStore, questionStore]) store.getState().start()
  return { palaceStore, roomStore, locusStore, questionStore }
}

describe('clearAllContent', () => {
  it('removes every palace, room, locus, and question', async () => {
    const stores = contentStores()
    await clearAllContent(stores)
    expect(stores.palaceStore.getState().palaces).toEqual([])
    expect(stores.roomStore.getState().rooms).toEqual([])
    expect(stores.locusStore.getState().loci).toEqual([])
    expect(stores.questionStore.getState().questions).toEqual([])
  })
})

describe('resetProgress', () => {
  it('replaces the record with a zeroed singleton', async () => {
    const store = createProgressStore(
      new InMemoryRepository<Progress>([
        makeProgress({ id: PROGRESS_ID, createdAt: at(0), xp: 500, streakCount: 9 }),
      ]),
    )
    store.getState().start()
    const reset = await resetProgress(store, NOW)
    expect(reset.xp).toBe(0)
    expect(reset.streakCount).toBe(0)
    expect(store.getState().progress?.xp).toBe(0)
  })
})

describe('clearNotifications', () => {
  it('empties the notifications history', async () => {
    const store = createNotificationStore(
      new InMemoryRepository<AppNotification>([
        makeNotification({ id: 'n1', createdAt: at(0), type: 'streak' }),
      ]),
    )
    store.getState().start()
    await clearNotifications(store)
    expect(store.getState().notifications).toEqual([])
  })
})

describe('resetEverything', () => {
  it('wipes content, progress, and notifications together', async () => {
    const content = contentStores()
    const progressStore = createProgressStore(
      new InMemoryRepository<Progress>([
        makeProgress({ id: PROGRESS_ID, createdAt: at(0), xp: 100 }),
      ]),
    )
    progressStore.getState().start()
    const notificationStore = createNotificationStore(
      new InMemoryRepository<AppNotification>([
        makeNotification({ id: 'n1', createdAt: at(0), type: 'quiz', read: true }),
      ]),
    )
    notificationStore.getState().start()

    await resetEverything({ ...content, progressStore, notificationStore }, NOW)

    expect(content.palaceStore.getState().palaces).toEqual([])
    expect(progressStore.getState().progress?.xp).toBe(0)
    expect(notificationStore.getState().notifications).toEqual([])
  })
})
