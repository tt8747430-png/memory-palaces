import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type AchievementId,
  type BadgeId,
  computeAchievements,
  computeBadges,
  computeTrainingTotals,
  isRoomCompleted,
  nextMilestone,
  totalTrainingDays,
  useStickyHeader,
} from '@/shared/lib'
import { useSessionStore } from '@/entities/session'
import { selectEffectiveProfile, useProfileStore, useProfileStoreApi } from '@/entities/profile'
import {
  selectIsReady as selectProgressReady,
  selectProgress,
  useProgressStore,
  useProgressStoreApi,
} from '@/entities/progress'
import {
  selectIsReady as selectPalacesReady,
  selectPalaces,
  usePalaceStore,
  usePalaceStoreApi,
} from '@/entities/palace'
import {
  roomsForPalace,
  selectIsReady as selectRoomsReady,
  selectRooms,
  useRoomStore,
  useRoomStoreApi,
} from '@/entities/room'
import {
  lociForRoom,
  selectIsReady as selectLociReady,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import {
  selectUnreadCount,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import { ProfileBar, ProfileHero } from '@/widgets/profile-header'
import { BadgesSection, NextMilestoneCard } from '@/widgets/badge-list'
import { AchievementsSection } from '@/widgets/achievement-list'
import { AppScreen } from '@/shared/ui'

export interface ProfilePageProps {
  /** Open the settings screen; wired by the route wrapper. */
  onOpenSettings?: () => void
  /** Open the notification history; wired by the route wrapper. */
  onOpenNotifications?: () => void
  /** Edit the profile photo (avatar tap); wired by the route wrapper. */
  onEditProfile?: () => void
  /** Open the Streak screen (from the avatar-edit and the Streak overview stat). */
  onOpenStreak?: () => void
  /** Open the full Badges page; wired by the route wrapper. */
  onOpenBadges?: () => void
  /** Open a single badge's detail (milestone nudge + preview medallions). */
  onOpenBadge?: (id: BadgeId) => void
  /** Open the full Achievements page; wired by the route wrapper. */
  onOpenAchievements?: () => void
  /** Open a single milestone's detail (preview medallions). */
  onOpenAchievement?: (id: AchievementId) => void
}

function joinedYearOf(createdAt: string): number | null {
  const year = new Date(createdAt).getUTCFullYear()
  return Number.isFinite(year) ? year : null
}

/** Profile tab. A guest identity today (account claim is Phase 9). One persistent bar
 * (name + notifications + settings) over a centered hero — circular avatar, @handle ·
 * joined, and a streak/XP/palaces headline. Below: the closest-milestone nudge, then the
 * Badges and Achievements preview rows. Everything derives live from the
 * progress/palace/room/locus stores — a glance, never stored or faked. */
export function ProfilePage({
  onOpenSettings,
  onOpenNotifications,
  onEditProfile,
  onOpenStreak,
  onOpenBadges,
  onOpenBadge,
  onOpenAchievements,
  onOpenAchievement,
}: ProfilePageProps = {}) {
  const header = useStickyHeader()
  const session = useSessionStore((state) => state.session)
  const profileStore = useProfileStoreApi()
  const profile = useProfileStore(selectEffectiveProfile)
  const progressStore = useProgressStoreApi()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const notificationStore = useNotificationStoreApi()
  const progress = useProgressStore(selectProgress)
  const palaces = usePalaceStore(selectPalaces)
  const rooms = useRoomStore(selectRooms)
  const loci = useLocusStore(selectLoci)
  const unreadCount = useNotificationStore(selectUnreadCount)
  // Gate the progress-derived hero/badges/achievements on hydration so a returning user
  // never sees a flash of zeros and locked medallions before RxDB resolves.
  const progressReady = useProgressStore(selectProgressReady)
  const palacesReady = usePalaceStore(selectPalacesReady)
  const roomsReady = useRoomStore(selectRoomsReady)
  const lociReady = useLocusStore(selectLociReady)
  const dataReady = progressReady && palacesReady && roomsReady && lociReady

  useEffect(() => {
    profileStore.getState().start()
    progressStore.getState().start()
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
    notificationStore.getState().start()
  }, [profileStore, progressStore, palaceStore, roomStore, locusStore, notificationStore])

  const { t } = useTranslation()
  const name = profile.name.trim() || session?.displayName || t('profile.guest')
  const xp = progress?.xp ?? 0
  const streakCount = progress?.streakCount ?? 0
  const longestStreak = progress?.longestStreak ?? 0
  const bestQuizAccuracy = progress?.bestQuizAccuracy ?? 0
  const trainingDays = useMemo(() => progress?.trainingDays ?? [], [progress])

  const totals = useMemo(() => computeTrainingTotals(rooms, loci), [rooms, loci])
  const daysTrained = useMemo(() => totalTrainingDays(trainingDays), [trainingDays])
  const anyPalaceCompleted = useMemo(
    () =>
      palaces.some((palace) => {
        const palaceRooms = roomsForPalace(rooms, palace.id)
        return (
          palaceRooms.length > 0 &&
          palaceRooms.every((room) => isRoomCompleted(lociForRoom(loci, room.id)))
        )
      }),
    [palaces, rooms, loci],
  )

  const badges = useMemo(
    () =>
      computeBadges({
        xp,
        longestStreak,
        roomsCompleted: totals.roomsCompleted,
        palaceCount: palaces.length,
        totalCards: totals.totalCards,
        trainingDayCount: daysTrained,
      }),
    [xp, longestStreak, totals, palaces.length, daysTrained],
  )
  const milestone = useMemo(() => nextMilestone(badges), [badges])
  const achievements = useMemo(
    () =>
      computeAchievements({
        palaceCount: palaces.length,
        streakCount,
        xp,
        bestQuizAccuracy,
        roomsCompleted: totals.roomsCompleted,
        anyPalaceCompleted,
      }),
    [palaces.length, streakCount, xp, bestQuizAccuracy, totals.roomsCompleted, anyPalaceCompleted],
  )

  return (
    <AppScreen
      className="pb-nav"
      scrollRef={header.ref}
      header={
        <ProfileBar
          header={header}
          name={name}
          unreadCount={unreadCount}
          onOpenNotifications={() => onOpenNotifications?.()}
          onOpenSettings={() => onOpenSettings?.()}
        />
      }
    >
      {!dataReady ? (
        <ProfileSkeleton />
      ) : (
        <>
          <ProfileHero
            name={name}
            username={profile.username}
            avatar={profile.avatar}
            xp={xp}
            streakCount={streakCount}
            palaceCount={palaces.length}
            joinedYear={session?.createdAt ? joinedYearOf(session.createdAt) : null}
            onEditProfile={() => onEditProfile?.()}
            onOpenStreak={() => onOpenStreak?.()}
          />

          {/* Fill at least a screen so a short profile still scrolls (gives the native
              pull-to-bounce something to overflow). Taller content scrolls normally. */}
          <div className="mt-8 flex min-h-[calc(100dvh-20rem)] flex-col gap-8">
            {milestone ? (
              <NextMilestoneCard badge={milestone} onOpen={() => onOpenBadge?.(milestone.id)} />
            ) : null}
            <BadgesSection
              badges={badges}
              onSeeAll={() => onOpenBadges?.()}
              onOpenBadge={(id) => onOpenBadge?.(id)}
            />
            <AchievementsSection
              achievements={achievements}
              onSeeAll={() => onOpenAchievements?.()}
              onOpenAchievement={(id) => onOpenAchievement?.(id)}
            />
          </div>
        </>
      )}
    </AppScreen>
  )
}

/** Calm placeholder shown until the progress stores hydrate, so the hero stats and the
 * badge/achievement rows never flash zeros or a wall of locks for a returning user. */
function ProfileSkeleton() {
  return (
    <div aria-hidden className="flex flex-col items-center pt-5">
      <div className="size-[104px] animate-pulse rounded-full bg-secondary/40" />
      <div className="mt-4 h-3 w-32 animate-pulse rounded-full bg-secondary/30" />
      <div className="mt-5 h-12 w-full max-w-[300px] animate-pulse rounded-card bg-secondary/30" />
      <div className="mt-8 w-full space-y-8">
        <div className="h-20 animate-pulse rounded-card bg-secondary/30" />
        <div className="h-24 animate-pulse rounded-card bg-secondary/20" />
        <div className="h-24 animate-pulse rounded-card bg-secondary/20" />
      </div>
    </div>
  )
}
