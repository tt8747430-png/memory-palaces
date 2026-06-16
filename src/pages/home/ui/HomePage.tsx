import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { countDueLoci, levelFromXp } from '@/shared/lib'
import { useSessionStore } from '@/entities/session'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { selectPalaces, usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import {
  selectUnreadCount,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import { HomeHeader } from '@/widgets/home-header'
import { DailyReviewCard } from '@/widgets/daily-review-card'
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
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const palaces = usePalaceStore(selectPalaces)
  const rooms = useRoomStore(selectRooms)
  const loci = useLocusStore(selectLoci)
  // Snapshot the clock so every derivation agrees within one render pass.
  const [now] = useState(() => Date.now())

  useEffect(() => {
    progressStore.getState().start()
    notificationStore.getState().start()
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
  }, [progressStore, notificationStore, palaceStore, roomStore, locusStore])

  const name = session?.displayName ?? 'Guest'
  const level = levelFromXp(progress?.xp ?? 0).level
  const dueCount = useMemo(
    () => countDueLoci(palaces, rooms, loci, now),
    [palaces, rooms, loci, now],
  )

  return (
    <AppScreen className="pt-safe">
      <HomeHeader
        name={name}
        level={level}
        unreadCount={unreadCount}
        onOpenProfile={() => onOpenProfile?.()}
        onOpenNotifications={() => onOpenNotifications?.()}
      />

      <DailyReviewCard
        className="mt-6"
        dueCount={dueCount}
        onOpen={() => onStartReview?.()}
      />

      <StreakSummary
        className="mt-6"
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
