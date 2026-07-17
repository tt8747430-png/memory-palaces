import type { RxCollection, RxStorage } from 'rxdb'
import { createRxDatabase } from 'rxdb'
import { STORAGE_PREFIX } from '@/shared/config/constants'
import { deckSchema, cardSchema, questionSchema, folderSchema } from '@/decks/data/schemas'
import { progressSchema } from '@/study'
import { preferencesSchema } from '@/settings'
import { profileSchema } from '@/auth'
import { notificationSchema } from '@/notifications'
import type { Deck, Card, Question, Folder } from '@/decks'
import type { Progress } from '@/study'
import type { Preferences } from '@/settings'
import type { Profile } from '@/auth'
import type { AppNotification } from '@/notifications'

export interface AppCollections {
  decks: RxCollection<Deck>
  cards: RxCollection<Card>
  folders: RxCollection<Folder>
  questions: RxCollection<Question>
  progress: RxCollection<Progress>
  preferences: RxCollection<Preferences>
  profiles: RxCollection<Profile>
  notifications: RxCollection<AppNotification>
}

export async function createAppDatabase<Internals, InstanceCreationOptions>(
  storage: RxStorage<Internals, InstanceCreationOptions>,
): Promise<AppCollections> {
  const database = await createRxDatabase({ name: STORAGE_PREFIX, storage })
  const collections = await database.addCollections({
    decks: { schema: deckSchema },
    cards: { schema: cardSchema },
    folders: { schema: folderSchema },
    questions: { schema: questionSchema },
    progress: { schema: progressSchema },
    preferences: { schema: preferencesSchema },
    profiles: { schema: profileSchema },
    notifications: { schema: notificationSchema },
  })
  return {
    decks: collections.decks,
    cards: collections.cards,
    folders: collections.folders,
    questions: collections.questions,
    progress: collections.progress,
    preferences: collections.preferences,
    profiles: collections.profiles,
    notifications: collections.notifications,
  }
}
