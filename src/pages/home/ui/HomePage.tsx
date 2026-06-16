import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { countDueLoci, isRoomCompleted, palaceProgress } from '@/shared/lib'
import { deletePalace, duplicatePalace } from '@/features/palace'
import { useSessionStore } from '@/entities/session'
import { selectEffectiveProfile, useProfileStore, useProfileStoreApi } from '@/entities/profile'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { selectPalaces, usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { roomsForPalace, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { lociForRoom, selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import {
  selectUnreadCount,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import { HomeHeader } from '@/widgets/home-header'
import { TodayTrainingCard, FirstRunGuide } from '@/widgets/today-training-card'
import { DailyReviewCard } from '@/widgets/daily-review-card'
import { UpNextCard, pickUpNextRooms } from '@/widgets/up-next-card'
import { PalacesOverview, type PalaceSummary } from '@/widgets/palaces-overview'
import { StreakSummary } from '@/widgets/streak-summary'
import { AppScreen, PullToRefresh } from '@/shared/ui'

export interface HomePageProps {
  /** Start a daily review session; wired by the route wrapper. */
  onStartReview?: () => void
  /** Open the notification history; wired by the route wrapper. */
  onOpenNotifications?: () => void
  /** Open the profile tab; wired by the route wrapper. */
  onOpenProfile?: () => void
  /** Open settings (from the header overflow menu); wired by the route wrapper. */
  onOpenSettings?: () => void
  /** Open a room straight into training; wired by the route wrapper. */
  onTrainRoom?: (roomId: string) => void
  /** Open a palace's detail; wired by the route wrapper. */
  onOpenPalace?: (palaceId: string) => void
  /** Jump to the Palaces tab; wired by the route wrapper. */
  onViewAllPalaces?: () => void
  /** Jump to the Palaces tab to create the first palace; wired by the route wrapper. */
  onCreatePalace?: () => void
}

export function HomePage({
  onStartReview,
  onOpenNotifications,
  onOpenProfile,
  onOpenSettings,
  onTrainRoom,
  onOpenPalace,
  onViewAllPalaces,
  onCreatePalace,
}: HomePageProps = {}) {
  const { t } = useTranslation()
  const session = useSessionStore((state) => state.session)
  const profileStore = useProfileStoreApi()
  const profile = useProfileStore(selectEffectiveProfile)
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
  // Snapshot the clock so every derivation agrees within one render pass; pull-to-
  // refresh advances it so due/up-next recompute against the current time.
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    profileStore.getState().start()
    progressStore.getState().start()
    notificationStore.getState().start()
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
  }, [profileStore, progressStore, notificationStore, palaceStore, roomStore, locusStore])

  const name = profile.name.trim() || session?.displayName || 'Guest'
  const dueCount = useMemo(
    () => countDueLoci(palaces, rooms, loci, now),
    [palaces, rooms, loci, now],
  )
  const upNext = useMemo(
    () => pickUpNextRooms(palaces, rooms, loci, now),
    [palaces, rooms, loci, now],
  )
  const palaceSummaries = useMemo<PalaceSummary[]>(
    () =>
      palaces
        .filter((palace) => !palace.archived)
        .map((palace) => {
          const completions = roomsForPalace(rooms, palace.id).map((room) =>
            isRoomCompleted(lociForRoom(loci, room.id)),
          )
          return {
            id: palace.id,
            name: palace.name,
            icon: palace.icon,
            progress: palaceProgress(completions),
            roomsCompleted: completions.filter(Boolean).length,
            totalRooms: completions.length,
          }
        }),
    [palaces, rooms, loci],
  )

  const hasPalaces = palaceSummaries.length > 0

  // The primary card chooses the calmest next step: the top-suggested room if there
  // is one, else the palaces list, else creating the first palace.
  const handleStartTraining = () => {
    const top = upNext[0]
    if (top) {
      onTrainRoom?.(top.roomId)
      return
    }
    if (hasPalaces) {
      onViewAllPalaces?.()
      return
    }
    onCreatePalace?.()
  }

  // "Train now" on a palace card: open its highest-priority room (review debt first),
  // else its first room, else the palace itself.
  const handleTrainPalace = (palaceId: string) => {
    const palace = palaces.find((entry) => entry.id === palaceId)
    const top = palace ? pickUpNextRooms([palace], rooms, loci, now, 1)[0] : undefined
    if (top) {
      onTrainRoom?.(top.roomId)
      return
    }
    const firstRoom = roomsForPalace(rooms, palaceId)[0]
    if (firstRoom) {
      onTrainRoom?.(firstRoom.id)
      return
    }
    onOpenPalace?.(palaceId)
  }

  const handleDuplicatePalace = (palaceId: string) => void duplicatePalace(palaceStore, palaceId)
  const handleDeletePalace = (palaceId: string) => void deletePalace(palaceStore, palaceId)

  // Local-first "refresh": re-pull every store and advance the clock so due counts and
  // up-next reflect the current moment. The brief hold makes the gesture feel answered.
  const handleRefresh = async () => {
    progressStore.getState().start()
    notificationStore.getState().start()
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
    setNow(Date.now())
    await new Promise((resolve) => setTimeout(resolve, 600))
  }

  return (
    <AppScreen className="pb-nav">
      <PullToRefresh onRefresh={handleRefresh} label={t('home.refreshing')}>
        <HomeHeader
          name={name}
          avatar={profile.avatar}
          xp={progress?.xp ?? 0}
          unreadCount={unreadCount}
          streakCount={progress?.streakCount ?? 0}
          dueCount={dueCount}
          showStats={hasPalaces}
          onOpenProfile={() => onOpenProfile?.()}
          onOpenSettings={() => onOpenSettings?.()}
          onOpenNotifications={() => onOpenNotifications?.()}
        />

        <TodayTrainingCard
          className="mt-6"
          hasPalaces={hasPalaces}
          dueCount={dueCount}
          xp={progress?.xp ?? 0}
          streakCount={progress?.streakCount ?? 0}
          onStartTraining={handleStartTraining}
          onCreatePalace={() => onCreatePalace?.()}
        />

        <DailyReviewCard className="mt-6" dueCount={dueCount} onOpen={() => onStartReview?.()} />

        {hasPalaces ? (
          <>
            <UpNextCard className="mt-6" rooms={upNext} onOpenRoom={(id) => onTrainRoom?.(id)} />

            <StreakSummary
              className="mt-6"
              showProgress={false}
              xp={progress?.xp ?? 0}
              streakCount={progress?.streakCount ?? 0}
              longestStreak={progress?.longestStreak ?? 0}
              trainingDays={progress?.trainingDays ?? []}
            />

            <PalacesOverview
              className="mt-6"
              palaces={palaceSummaries}
              onOpenPalace={(id) => onOpenPalace?.(id)}
              onViewAll={() => onViewAllPalaces?.()}
              onTrainPalace={handleTrainPalace}
              onDuplicatePalace={handleDuplicatePalace}
              onDeletePalace={handleDeletePalace}
            />
          </>
        ) : (
          <FirstRunGuide className="mt-6" />
        )}
      </PullToRefresh>
    </AppScreen>
  )
}
