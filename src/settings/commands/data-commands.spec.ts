import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/data'
import {
  makeFolder,
  makeDeck,
  makeCard,
  makeQuestion,
  CardStore,
  DeckStore,
  FolderStore,
  QuestionStore,
} from '@/decks'
import type { Folder, Deck, Card, Question } from '@/decks'
import { makeProgress, PROGRESS_ID, ProgressStore } from '@/study'
import type { Progress } from '@/study'
import { makeNotification, NotificationStore } from '@/notifications'
import type { AppNotification } from '@/notifications'
import { clearAllContent, clearNotifications, resetEverything, resetProgress } from './data-index'

const at = (ms: number) => new Date(ms).toISOString()
const NOW = Date.UTC(2026, 0, 1)

function contentStores() {
  const folderStore = new FolderStore(
    new InMemoryRepository<Folder>([
      makeFolder({ id: 'f1', createdAt: at(0), name: 'Bible', color: '', icon: '📁' }),
    ]),
  )
  const deckStore = new DeckStore(
    new InMemoryRepository<Deck>([makeDeck({ id: 'd1', createdAt: at(0), name: 'Home' })]),
  )
  const cardStore = new CardStore(
    new InMemoryRepository<Card>([
      makeCard({ id: 'c1', createdAt: at(0), deckId: 'd1', front: 'a', back: 'b' }),
    ]),
  )
  const questionStore = new QuestionStore(
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
  for (const store of [folderStore, deckStore, cardStore, questionStore]) store.start()
  return { folderStore, deckStore, cardStore, questionStore }
}

describe('clearAllContent', () => {
  it('removes every folder, deck, card, and question', async () => {
    const stores = contentStores()
    await clearAllContent(stores)
    expect(stores.folderStore.folders()).toEqual([])
    expect(stores.deckStore.decks()).toEqual([])
    expect(stores.cardStore.cards()).toEqual([])
    expect(stores.questionStore.questions()).toEqual([])
  })
})

describe('resetProgress', () => {
  it('replaces the record with a zeroed singleton', async () => {
    const store = new ProgressStore(
      new InMemoryRepository<Progress>([
        makeProgress({ id: PROGRESS_ID, createdAt: at(0), xp: 500, streakCount: 9 }),
      ]),
    )
    store.start()
    const reset = await resetProgress(store, NOW)
    expect(reset.xp).toBe(0)
    expect(reset.streakCount).toBe(0)
    expect(store.progress()?.xp).toBe(0)
  })
})

describe('clearNotifications', () => {
  it('empties the notifications history', async () => {
    const store = new NotificationStore(
      new InMemoryRepository<AppNotification>([
        makeNotification({ id: 'n1', createdAt: at(0), type: 'streak' }),
      ]),
    )
    store.start()
    await clearNotifications(store)
    expect(store.notifications()).toEqual([])
  })
})

describe('resetEverything', () => {
  it('wipes content, progress, and notifications together', async () => {
    const content = contentStores()
    const progressStore = new ProgressStore(
      new InMemoryRepository<Progress>([
        makeProgress({ id: PROGRESS_ID, createdAt: at(0), xp: 100 }),
      ]),
    )
    progressStore.start()
    const notificationStore = new NotificationStore(
      new InMemoryRepository<AppNotification>([
        makeNotification({ id: 'n1', createdAt: at(0), type: 'quiz', read: true }),
      ]),
    )
    notificationStore.start()

    await resetEverything({ ...content, progressStore, notificationStore }, NOW)

    expect(content.deckStore.decks()).toEqual([])
    expect(progressStore.progress()?.xp).toBe(0)
    expect(notificationStore.notifications()).toEqual([])
  })
})
