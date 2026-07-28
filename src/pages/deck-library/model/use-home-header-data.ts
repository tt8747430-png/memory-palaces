import { useTranslation } from 'react-i18next'
import { selectEffectiveProfile, useProfileStore } from '@/entities/profile'
import { selectProgress, useProgressStore } from '@/entities/progress'
import { selectEffectivePreferences, usePreferencesStore } from '@/entities/preferences'
import { selectUnreadCount, useNotificationStore } from '@/entities/notification'
import { useSessionStore } from '@/entities/session'
import { dayKey } from '@/shared/lib'

export interface HomeHeaderData {
  name: string
  avatar?: string | null
  xp: number
  unreadCount: number
  streak: { count: number; dayCount: number; dailyGoal: number }
}

export function useHomeHeaderData(): HomeHeaderData {
  const { t } = useTranslation()

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
