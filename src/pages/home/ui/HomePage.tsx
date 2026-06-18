import { useEffect, useMemo, useState } from 'react'
import { countDueLoci, isRoomCompleted, palaceProgress, useCollapsibleHeader } from '@/shared/lib'
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
import { AppScreen } from '@/shared/ui'

export interface HomePageProps {
  /** Start a daily review session; wired by the route wrapper. */
  onStartReview?: () => void
  /** Open the notification history; wired by the route wrapper. */
  onOpenNotifications?: () => void
  /** Open the profile tab; wired by the route wrapper. */
  onOpenProfile?: () => void
  /** Open the Streak screen from the header streak chip; wired by the route wrapper. */
  onOpenStreak?: () => void
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
  onOpenStreak,
  onTrainRoom,
  onOpenPalace,
  onViewAllPalaces,
  onCreatePalace,
}: HomePageProps = {}) {
  const header = useCollapsibleHeader()
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
  // Snapshot the clock so every derivation agrees within one render pass. Stores are
  // live (RxDB-reactive), so due/up-next stay current without a manual refresh.
  const [now] = useState(() => Date.now())

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

  return (
    <AppScreen
      className="pb-nav"
      scrollRef={header.ref}
      header={
        <HomeHeader
          header={header}
          name={name}
          avatar={profile.avatar}
          xp={progress?.xp ?? 0}
          unreadCount={unreadCount}
          streakCount={progress?.streakCount ?? 0}
          dueCount={dueCount}
          showStats={hasPalaces}
          onOpenProfile={() => onOpenProfile?.()}
          onOpenNotifications={() => onOpenNotifications?.()}
          onOpenStreak={() => onOpenStreak?.()}
        />
      }
    >
      {/* Guarantee scroll room so the pinned header can always recede, even with a single
          row of palaces. Sized off the viewport (not the scroll container) so it stays
          constant while the header collapses — a container-relative min-height would grow
          as the header shrinks and make the collapse stutter. Taller content scrolls
          normally. */}
      <div className="min-h-[calc(100dvh+7.5rem)]">
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
      </div>
    </AppScreen>
  )
}
