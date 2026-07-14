import type { RxCollection, RxStorage } from 'rxdb'
import { createRxDatabase } from 'rxdb'
import { STORAGE_PREFIX } from '@app/shared/config/constants'
import { deckSchema, cardSchema, questionSchema, folderSchema } from '@app/decks/data/schemas'
import { progressSchema } from '@app/study/data/progress-store'
import { preferencesSchema } from '@app/settings/data/preferences-store'
import { profileSchema } from '@app/auth/data/stores'
import { notificationSchema } from '@app/notifications/data/notification-store'
import type { Deck } from '@app/decks/model/deck'
import type { Card } from '@app/decks/model/card'
import type { Question } from '@app/decks/model/question'
import type { Folder } from '@app/decks/model/folder'
import type { Progress } from '@app/study/model/progress'
import type { Preferences } from '@app/settings/model/preferences'
import type { Profile } from '@app/auth/model/profile'
import type { AppNotification } from '@app/notifications/model/notification'

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
