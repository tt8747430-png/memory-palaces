import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { levelFromXp } from '@/shared/lib'
import { useSessionStore } from '@/entities/session'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import {
  selectUnreadCount,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import { HomeHeader } from '@/widgets/home-header'
import { StreakSummary } from '@/widgets/streak-summary'
import { AppScreen, Button } from '@/shared/ui'

export interface HomePageProps {
  /** Start a daily review session; wired by the route wrapper. */
  onStartReview?: () => void
  /** Open the notification history; wired by the route wrapper. */
  onOpenNotifications?: () => void
  /** Open the profile tab; wired by the route wrapper. */
  onOpenProfile?: () => void
}

export function HomePage({
  onStartReview,
  onOpenNotifications,
  onOpenProfile,
}: HomePageProps = {}) {
  const { t } = useTranslation()
  const session = useSessionStore((state) => state.session)
  const status = useSessionStore((state) => state.status)
  const progressStore = useProgressStoreApi()
  const progress = useProgressStore(selectProgress)
  const notificationStore = useNotificationStoreApi()
  const unreadCount = useNotificationStore(selectUnreadCount)

  useEffect(() => {
    progressStore.getState().start()
    notificationStore.getState().start()
  }, [progressStore, notificationStore])

  const name = session?.displayName ?? 'Guest'
  const level = levelFromXp(progress?.xp ?? 0).level

  return (
    <AppScreen className="pt-safe">
      <HomeHeader
        name={name}
        level={level}
        unreadCount={unreadCount}
        onOpenProfile={() => onOpenProfile?.()}
        onOpenNotifications={() => onOpenNotifications?.()}
      />

      <StreakSummary
        className="mt-8"
        xp={progress?.xp ?? 0}
        streakCount={progress?.streakCount ?? 0}
        longestStreak={progress?.longestStreak ?? 0}
        trainingDays={progress?.trainingDays ?? []}
      />

      <div className="mt-auto pb-28 pt-10">
        <Button size="lg" className="w-full" disabled={status !== 'ready'} onClick={onStartReview}>
          {t('home.primaryCta')}
        </Button>
      </div>
    </AppScreen>
  )
}
