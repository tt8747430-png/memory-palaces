import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, makePalace, type Palace } from '@/entities/palace'
import { createRoomStore, makeRoom, type Room } from '@/entities/room'
import { createLocusStore, makeLocus, type Locus } from '@/entities/locus'
import { createQuestionStore, makeQuestion, type Question } from '@/entities/question'
import { createProgressStore, makeProgress, type Progress } from '@/entities/progress'
import { createPreferencesStore, makePreferences, type Preferences } from '@/entities/preferences'
import { createProfileStore, makeProfile, type Profile } from '@/entities/profile'
import {
  createNotificationStore,
  makeNotification,
  type AppNotification,
} from '@/entities/notification'
import { exportProgress, importProgress, InvalidImportError, type TransferStores } from './index'

const at = (ms: number) => new Date(ms).toISOString()

interface Seed {
  palaces?: Palace[]
  rooms?: Room[]
  loci?: Locus[]
  questions?: Question[]
  progress?: Progress[]
  preferences?: Preferences[]
  profile?: Profile[]
  notifications?: AppNotification[]
}

function buildStores(seed: Seed = {}): TransferStores {
  const stores: TransferStores = {
    palaceStore: createPalaceStore(new InMemoryRepository<Palace>(seed.palaces ?? [])),
    roomStore: createRoomStore(new InMemoryRepository<Room>(seed.rooms ?? [])),
    locusStore: createLocusStore(new InMemoryRepository<Locus>(seed.loci ?? [])),
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
      palaces: [makePalace({ id: 'p1', createdAt: at(0), name: 'Home' })],
      rooms: [makeRoom({ id: 'r1', createdAt: at(0), palaceId: 'p1', title: 'Hall', order: 0 })],
      loci: [makeLocus({ id: 'l1', createdAt: at(0), roomId: 'r1', front: 'a', back: 'b' })],
      questions: [
        makeQuestion({
          id: 'q1',
          createdAt: at(0),
          roomId: 'r1',
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

    expect(target.palaceStore.getState().palaces).toHaveLength(1)
    expect(target.locusStore.getState().loci[0]?.front).toBe('a')
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
