import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { selectEffectiveProfile, useProfileStore, useProfileStoreApi } from '@/entities/profile'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import {
  selectUnreadCount,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import { useSessionStore } from '@/entities/session'
import { dayKey } from '@/shared/lib'

export interface HomeHeaderData {
  name: string
  avatar?: string | null
  xp: number
  unreadCount: number
  /** The daily goal comes from Preferences, so the header can say how close today is. */
  streak: { count: number; dayCount: number; dailyGoal: number }
}

/** Everything the home header shows — learner, level, streak, unread — in one read. */
export function useHomeHeaderData(): HomeHeaderData {
  const { t } = useTranslation()
  const profileStore = useProfileStoreApi()
  const progressStore = useProgressStoreApi()
  const preferencesStore = usePreferencesStoreApi()
  const notificationStore = useNotificationStoreApi()

  useEffect(() => {
    profileStore.getState().start()
    progressStore.getState().start()
    preferencesStore.getState().start()
    notificationStore.getState().start()
  }, [profileStore, progressStore, preferencesStore, notificationStore])

  const session = useSessionStore((state) => state.session)
  const profile = useProfileStore(selectEffectiveProfile)
  const progress = useProgressStore(selectProgress)
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const unreadCount = useNotificationStore(selectUnreadCount)

  const today = dayKey(Date.now())
  return {
    name: profile.name.trim() || session?.displayName || t('profile.guest'),
    avatar: profile.avatar,
    xp: progress?.xp ?? 0,
    unreadCount,
    streak: {
      count: progress?.streakCount ?? 0,
      dayCount: progress?.activeDayKey === today ? progress.activeDayCount : 0,
      dailyGoal: prefs.dailyGoal,
    },
  }
}
