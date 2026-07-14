import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createFolderStore, makeFolder, type Folder } from '@/entities/folder'
import { createDeckStore, makeDeck, type Deck } from '@/entities/deck'
import { createCardStore, type Card, makeCard } from '@/entities/card'
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
  const folderStore = createFolderStore(
    new InMemoryRepository<Folder>([
      makeFolder({ id: 'f1', createdAt: at(0), name: 'Bible', color: '', icon: '📁' }),
    ]),
  )
  const deckStore = createDeckStore(
    new InMemoryRepository<Deck>([makeDeck({ id: 'd1', createdAt: at(0), name: 'Home' })]),
  )
  const cardStore = createCardStore(
    new InMemoryRepository<Card>([
      makeCard({ id: 'c1', createdAt: at(0), deckId: 'd1', front: 'a', back: 'b' }),
    ]),
  )
  const questionStore = createQuestionStore(
    new InMemoryRepository<Question>([
      makeQuestion({
        id: 'q1',
        createdAt: at(0),
        deckId: 'd1',
        prompt: '?',
        options: ['a', 'b'],
        correctAnswer: 0,
      }),
    ]),
  )
  for (const store of [folderStore, deckStore, cardStore, questionStore]) store.getState().start()
  return { folderStore, deckStore, cardStore, questionStore }
}

describe('clearAllContent', () => {
  it('removes every folder, deck, card, and question', async () => {
    const stores = contentStores()
    await clearAllContent(stores)
    expect(stores.folderStore.getState().folders).toEqual([])
    expect(stores.deckStore.getState().decks).toEqual([])
    expect(stores.cardStore.getState().cards).toEqual([])
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

    expect(content.deckStore.getState().decks).toEqual([])
    expect(progressStore.getState().progress?.xp).toBe(0)
    expect(notificationStore.getState().notifications).toEqual([])
  })
})
