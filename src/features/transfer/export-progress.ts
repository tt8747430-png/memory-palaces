import type { Palace, PalaceStore } from '@/entities/palace'
import type { Room, RoomStore } from '@/entities/room'
import type { Locus, LocusStore } from '@/entities/locus'
import type { Question, QuestionStore } from '@/entities/question'
import type { Progress, ProgressStore } from '@/entities/progress'
import type { Preferences, PreferencesStore } from '@/entities/preferences'
import type { Profile, ProfileStore } from '@/entities/profile'
import type { AppNotification, NotificationStore } from '@/entities/notification'

/** Bump when the bundle shape changes incompatibly; import rejects unknown majors. */
export const APP_DATA_VERSION = 1

/** A full snapshot of the learner's data, for backup or device transfer. */
export interface AppDataBundle {
  version: number
  exportedAt: string
  palaces: Palace[]
  rooms: Room[]
  loci: Locus[]
  questions: Question[]
  progress: Progress | null
  preferences: Preferences | null
  profile: Profile | null
  notifications: AppNotification[]
}

/** The reactive stores export/import read from and write to. The caller starts them
 * (the page already does on mount) so their lists hold the full collections. */
export interface TransferStores {
  palaceStore: PalaceStore
  roomStore: RoomStore
  locusStore: LocusStore
  questionStore: QuestionStore
  progressStore: ProgressStore
  preferencesStore: PreferencesStore
  profileStore: ProfileStore
  notificationStore: NotificationStore
}

/** Command — serialize all of the learner's data to a pretty-printed JSON string. */
export function exportProgress(stores: TransferStores, now: number = Date.now()): string {
  const bundle: AppDataBundle = {
    version: APP_DATA_VERSION,
    exportedAt: new Date(now).toISOString(),
    palaces: stores.palaceStore.getState().palaces,
    rooms: stores.roomStore.getState().rooms,
    loci: stores.locusStore.getState().loci,
    questions: stores.questionStore.getState().questions,
    progress: stores.progressStore.getState().progress,
    preferences: stores.preferencesStore.getState().preferences,
    profile: stores.profileStore.getState().profile,
    notifications: stores.notificationStore.getState().notifications,
  }
  return JSON.stringify(bundle, null, 2)
}
