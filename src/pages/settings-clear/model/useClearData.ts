import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { selectPalaceCount, usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { useRoomStoreApi } from '@/entities/room'
import { useLocusStoreApi } from '@/entities/locus'
import { useQuestionStoreApi } from '@/entities/question'
import {
  progressTrainingDays,
  selectProgress,
  useProgressStore,
  useProgressStoreApi,
} from '@/entities/progress'
import {
  selectNotifications,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import {
  clearAllContent,
  clearNotifications,
  resetEverything,
  resetProgress,
  type ResetEverythingStores,
} from '@/features/data'

/** What each clear target will remove, live from the stores — so the screen can show the
 * weight of every action and dim the ones with nothing to clear. */
export interface ClearDataCounts {
  palaces: number
  days: number
  xp: number
  notifications: number
}

export interface ClearData {
  counts: ClearDataCounts
  clearPalaces: () => Promise<void>
  resetStats: () => Promise<void>
  clearNotificationHistory: () => Promise<void>
  resetEverything: () => Promise<void>
}

/** Wires the data-reset commands to the live stores for the Clear data screen. Starts every
 * store so the counts are accurate and the wipe is complete, then exposes one method per
 * destructive action, each confirming with a single "Data cleared" toast. The page gates
 * each call behind its own confirm dialog. */
export function useClearData(): ClearData {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()
  const progressStore = useProgressStoreApi()
  const notificationStore = useNotificationStoreApi()

  const stores = useMemo<ResetEverythingStores>(
    () => ({ palaceStore, roomStore, locusStore, questionStore, progressStore, notificationStore }),
    [palaceStore, roomStore, locusStore, questionStore, progressStore, notificationStore],
  )

  useEffect(() => {
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
    questionStore.getState().start()
    progressStore.getState().start()
    notificationStore.getState().start()
  }, [palaceStore, roomStore, locusStore, questionStore, progressStore, notificationStore])

  const palaces = usePalaceStore(selectPalaceCount)
  const progress = useProgressStore(selectProgress)
  const notifications = useNotificationStore(selectNotifications)

  const counts: ClearDataCounts = {
    palaces,
    days: progressTrainingDays(progress),
    xp: progress?.xp ?? 0,
    notifications: notifications.length,
  }

  const done = () => toast.success(t('settings.clearScreen.done'))

  return {
    counts,
    clearPalaces: async () => {
      await clearAllContent(stores)
      done()
    },
    resetStats: async () => {
      await resetProgress(progressStore)
      done()
    },
    clearNotificationHistory: async () => {
      await clearNotifications(notificationStore)
      done()
    },
    resetEverything: async () => {
      await resetEverything(stores)
      done()
    },
  }
}
