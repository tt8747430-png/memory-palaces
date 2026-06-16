import { useEffect, useMemo, useState } from 'react'
import { countDueLoci, isRoomCompleted, palaceProgress } from '@/shared/lib'
import { useSessionStore } from '@/entities/session'
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
import { AppScreen } from '@/shared/ui'

export interface HomePageProps {
  /** Start a daily review session; wired by the route wrapper. */
  onStartReview?: () => void
  /** Open the notification history; wired by the route wrapper. */
  onOpenNotifications?: () => void
  /** Open the profile tab; wired by the route wrapper. */
  onOpenProfile?: () => void
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
  onTrainRoom,
  onOpenPalace,
  onViewAllPalaces,
  onCreatePalace,
}: HomePageProps = {}) {
  const session = useSessionStore((state) => state.session)
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

  return (
    <AppScreen className="pb-nav">
      <HomeHeader
        name={name}
        xp={progress?.xp ?? 0}
        unreadCount={unreadCount}
        streakCount={progress?.streakCount ?? 0}
        dueCount={dueCount}
        showStats={hasPalaces}
        onOpenProfile={() => onOpenProfile?.()}
        onOpenNotifications={() => onOpenNotifications?.()}
      />

      <TodayTrainingCard
        className="mt-6"
        hasPalaces={hasPalaces}
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
          />
        </>
      ) : (
        <FirstRunGuide className="mt-6" />
      )}
    </AppScreen>
  )
}
