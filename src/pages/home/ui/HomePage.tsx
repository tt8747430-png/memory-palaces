import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { countDueLoci, isRoomCompleted, palaceProgress, useStickyHeader } from '@/shared/lib'
import { deletePalace, duplicatePalace } from '@/features/palace'
import { useSessionStore } from '@/entities/session'
import { selectEffectiveProfile, useProfileStore, useProfileStoreApi } from '@/entities/profile'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { selectIsReady, selectPalaces, usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { roomsForPalace, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { lociForRoom, selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import {
  selectUnreadCount,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import { HomeHeader } from '@/widgets/home-header'
import { TodayTrainingCard, FirstRunGuide } from '@/widgets/today-training-card'
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
  const { t } = useTranslation()
  const header = useStickyHeader()
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
  // Gate the empty-vs-content branch on the palace store being hydrated, so a returning
  // user never flashes the first-run "Build your memory palace" state before RxDB resolves.
  const palacesReady = usePalaceStore(selectIsReady)
  const rooms = useRoomStore(selectRooms)
  const loci = useLocusStore(selectLoci)
  // Palaces awaiting an undoable delete: hidden from the home immediately, removed for
  // real only once the undo toast closes.
  const [pendingDelete, setPendingDelete] = useState<ReadonlySet<string>>(() => new Set())
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
        .filter((palace) => !palace.archived && !pendingDelete.has(palace.id))
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
    [palaces, rooms, loci, pendingDelete],
  )

  const hasPalaces = palaceSummaries.length > 0
  const hasTrainableRoom = upNext.length > 0

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

  // Delete is forgiving: the palace vanishes immediately but the actual removal is
  // deferred behind an undo toast, and only committed once that toast closes.
  const handleDeletePalace = (palaceId: string) => {
    const target = palaces.find((entry) => entry.id === palaceId)
    setPendingDelete((prev) => new Set(prev).add(palaceId))
    let undone = false
    const commit = () => {
      if (!undone) void deletePalace(palaceStore, palaceId)
    }
    toast(t('palaces.deleted', { name: target?.name ?? '' }), {
      action: {
        label: t('common.undo'),
        onClick: () => {
          undone = true
          setPendingDelete((prev) => {
            const next = new Set(prev)
            next.delete(palaceId)
            return next
          })
        },
      },
      onAutoClose: commit,
      onDismiss: commit,
    })
  }

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
          onOpenProfile={() => onOpenProfile?.()}
          onOpenNotifications={() => onOpenNotifications?.()}
        />
      }
    >
      {!palacesReady ? (
        <HomeSkeleton />
      ) : (
        <>
          <TodayTrainingCard
            className="mt-6"
            hasPalaces={hasPalaces}
            hasTrainableRoom={hasTrainableRoom}
            dueCount={dueCount}
            streakCount={progress?.streakCount ?? 0}
            onStartReview={() => onStartReview?.()}
            onStartTraining={handleStartTraining}
            onCreatePalace={() => onCreatePalace?.()}
          />

          {hasPalaces ? (
            <>
              <UpNextCard className="mt-6" rooms={upNext} onOpenRoom={(id) => onTrainRoom?.(id)} />

              {/* Last in flow, so scrolling to the bottom lands the palaces right above the
                  floating nav (the page's `pb-nav` clears it) instead of on empty space. */}
              <PalacesOverview
                className="mt-6"
                palaces={palaceSummaries}
                onOpenPalace={(id) => onOpenPalace?.(id)}
                onViewAll={() => onViewAllPalaces?.()}
                onTrainPalace={handleTrainPalace}
                onDuplicatePalace={handleDuplicatePalace}
                onDeletePalace={handleDeletePalace}
              />

              {/* Nothing queued (all caught up, or palaces still need rooms): resurface the
                  method primer so a returning user always has a door back to "how it works". */}
              {hasTrainableRoom ? null : <FirstRunGuide className="mt-6" />}
            </>
          ) : (
            // Day-one empty state has no palaces to strand, so fill past the viewport to keep
            // the page scrollable — the native pull-to-bounce needs something to overflow.
            <FirstRunGuide className="mt-6 min-h-[calc(100dvh-24rem)]" />
          )}
        </>
      )}
    </AppScreen>
  )
}

/** Calm load placeholder shown until the palace store hydrates — keeps the daylight
 * ground steady and prevents a flash of the first-run state for returning users. */
function HomeSkeleton() {
  return (
    <div aria-hidden className="mt-6 space-y-6">
      <div className="h-44 animate-pulse rounded-card-featured bg-secondary/40" />
      <div className="h-20 animate-pulse rounded-card bg-secondary/30" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-36 animate-pulse rounded-card-featured bg-secondary/30" />
        <div className="h-36 animate-pulse rounded-card-featured bg-secondary/30" />
      </div>
    </div>
  )
}
