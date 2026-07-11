import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createFolderStore, makeFolder, type Folder } from '@/entities/folder'
import { createDeckStore, makeDeck, type Deck } from '@/entities/deck'
import { createCardStore, type Card, makeCard } from '@/entities/card'
import { createQuestionStore, makeQuestion, type Question } from '@/entities/question'
import { createProgressStore, makeProgress, type Progress } from '@/entities/progress'
import { createPreferencesStore, makePreferences, type Preferences } from '@/entities/preferences'
import { createProfileStore, makeProfile, type Profile } from '@/entities/profile'
import {
  type AppNotification,
  createNotificationStore,
  makeNotification,
} from '@/entities/notification'
import { exportProgress, importProgress, InvalidImportError, type TransferStores } from './index'

const at = (ms: number) => new Date(ms).toISOString()

interface Seed {
  folders?: Folder[]
  decks?: Deck[]
  cards?: Card[]
  questions?: Question[]
  progress?: Progress[]
  preferences?: Preferences[]
  profile?: Profile[]
  notifications?: AppNotification[]
}

function buildStores(seed: Seed = {}): TransferStores {
  const stores: TransferStores = {
    folderStore: createFolderStore(new InMemoryRepository<Folder>(seed.folders ?? [])),
    deckStore: createDeckStore(new InMemoryRepository<Deck>(seed.decks ?? [])),
    cardStore: createCardStore(new InMemoryRepository<Card>(seed.cards ?? [])),
    questionStore: createQuestionStore(new InMemoryRepository<Question>(seed.questions ?? [])),
    progressStore: createProgressStore(new InMemoryRepository<Progress>(seed.progress ?? [])),
    preferencesStore: createPreferencesStore(
      new InMemoryRepository<Preferences>(seed.preferences ?? []),
    ),
    profileStore: createProfileStore(new InMemoryRepository<Profile>(seed.profile ?? [])),
    notificationStore: createNotificationStore(
      new InMemoryRepository<AppNotification>(seed.notifications ?? []),
    ),
  }
  for (const store of Object.values(stores)) store.getState().start()
  return stores
}

describe('exportProgress / importProgress', () => {
  it('round-trips all data into fresh stores', async () => {
    const source = buildStores({
      folders: [makeFolder({ id: 'f1', createdAt: at(0), name: 'Bible', color: '', icon: '📁' })],
      decks: [makeDeck({ id: 'd1', createdAt: at(0), name: 'Home' })],
      cards: [makeCard({ id: 'c1', createdAt: at(0), deckId: 'd1', front: 'a', back: 'b' })],
      questions: [
        makeQuestion({
          id: 'q1',
          createdAt: at(0),
          deckId: 'd1',
          prompt: '?',
          options: ['a', 'b'],
          correctAnswer: 0,
        }),
      ],
      progress: [makeProgress({ id: 'progress', createdAt: at(0), xp: 120 })],
      preferences: [makePreferences({ id: 'preferences', createdAt: at(0), soundEffects: false })],
      profile: [makeProfile({ id: 'profile', createdAt: at(0), name: 'Ada' })],
      notifications: [makeNotification({ id: 'n1', createdAt: at(0), type: 'streak' })],
    })

    const json = exportProgress(source, Date.UTC(2026, 0, 1))
    const target = buildStores()
    await importProgress(json, target)

    expect(target.deckStore.getState().decks).toHaveLength(1)
    expect(target.folderStore.getState().folders).toHaveLength(1)
    expect(target.cardStore.getState().cards[0]?.front).toBe('a')
    expect(target.questionStore.getState().questions).toHaveLength(1)
    expect(target.progressStore.getState().progress?.xp).toBe(120)
    expect(target.profileStore.getState().profile?.name).toBe('Ada')
    expect(target.preferencesStore.getState().preferences?.soundEffects).toBe(false)
    expect(target.notificationStore.getState().notifications).toHaveLength(1)
  })

  it('throws InvalidImportError on malformed JSON', async () => {
    await expect(importProgress('not json', buildStores())).rejects.toBeInstanceOf(
      InvalidImportError,
    )
  })

  it('throws InvalidImportError when required fields are missing', async () => {
    await expect(
      importProgress(JSON.stringify({ version: 1 }), buildStores()),
    ).rejects.toBeInstanceOf(InvalidImportError)
  })
})
