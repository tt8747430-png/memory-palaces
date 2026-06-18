import { type ReactNode, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  CalendarCheck,
  ChevronRight,
  Flame,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import {
  cn,
  computeAchievements,
  computeBadges,
  computeTrainingTotals,
  isRoomCompleted,
  totalTrainingDays,
  useCollapsibleHeader,
} from '@/shared/lib'
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
import { ProfileHeader } from '@/widgets/profile-header'
import { BadgesSection } from '@/widgets/badge-list'
import { AchievementsSection } from '@/widgets/achievement-list'
import { AppScreen, Card } from '@/shared/ui'

export interface ProfilePageProps {
  /** Open the settings screen; wired by the route wrapper. */
  onOpenSettings?: () => void
  /** Open the notification history; wired by the route wrapper. */
  onOpenNotifications?: () => void
  /** Open the Streak screen (from the avatar-edit and the Streak overview stat). */
  onEditProfile?: () => void
  /** Open the Streak screen; wired by the route wrapper. */
  onOpenStreak?: () => void
  /** Open the full Badges page; wired by the route wrapper. */
  onOpenBadges?: () => void
  /** Open the full Achievements page; wired by the route wrapper. */
  onOpenAchievements?: () => void
}

const GLANCE_ICON = 'size-[18px]'

function joinedYearOf(createdAt: string): number | null {
  const year = new Date(createdAt).getUTCFullYear()
  return Number.isFinite(year) ? year : null
}

/** Profile tab. A guest identity today (account claim is Phase 9). Below the redesigned
 * header: a compact six-stat Overview (the Streak stat opens the Streak page), then the
 * Badges and Achievements preview rows, each opening its full grid. Everything derives
 * live from the progress/palace/room/locus stores — a glance, never stored or faked. */
export function ProfilePage({
  onOpenSettings,
  onOpenNotifications,
  onEditProfile,
  onOpenStreak,
  onOpenBadges,
  onOpenAchievements,
}: ProfilePageProps = {}) {
  const { t } = useTranslation()
  const header = useCollapsibleHeader()
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

  useEffect(() => {
    profileStore.getState().start()
    progressStore.getState().start()
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
    notificationStore.getState().start()
  }, [profileStore, progressStore, palaceStore, roomStore, locusStore, notificationStore])

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

  const glances = [
    {
      icon: <Flame className={GLANCE_ICON} fill="currentColor" />,
      value: String(streakCount),
      label: t('profile.tiles.currentStreak'),
      onClick: () => onOpenStreak?.(),
    },
    { icon: <Zap className={GLANCE_ICON} />, value: xp.toLocaleString(), label: t('profile.tiles.totalXp') },
    { icon: <Building2 className={GLANCE_ICON} />, value: String(palaces.length), label: t('profile.tiles.palaces') },
    { icon: <TrendingUp className={GLANCE_ICON} />, value: String(totals.roomsCompleted), label: t('profile.tiles.roomsDone') },
    { icon: <Target className={GLANCE_ICON} />, value: `${bestQuizAccuracy}%`, label: t('profile.tiles.bestAccuracy') },
    { icon: <CalendarCheck className={GLANCE_ICON} />, value: String(daysTrained), label: t('profile.tiles.daysTrained') },
  ]

  return (
    <AppScreen className="pb-nav" scrollRef={header.ref}>
      <ProfileHeader
        header={header}
        name={name}
        username={profile.username}
        avatar={profile.avatar}
        xp={xp}
        joinedYear={session?.createdAt ? joinedYearOf(session.createdAt) : null}
        unreadCount={unreadCount}
        onOpenSettings={() => onOpenSettings?.()}
        onOpenNotifications={() => onOpenNotifications?.()}
        onEditProfile={() => onEditProfile?.()}
      />

      {/* Fill at least the area under the collapsed header (viewport minus the bottom
          nav inset ~7rem and the compact bar ~5rem) so short profiles still scroll far
          enough to recede the hero and tuck the Overview under the collapsed header,
          instead of stranding it mid-screen. Taller content scrolls normally. */}
      <div className="mt-6 flex min-h-[calc(100dvh-12rem)] flex-col gap-8">
        <section>
          <h2 className="mb-3 px-1 text-[length:var(--p-text-title)] font-bold text-heading">
            {t('profile.overview')}
          </h2>
          <Card className="grid grid-cols-2 gap-px overflow-hidden bg-border p-0">
            {glances.map((glance) => (
              <StatGlance
                key={glance.label}
                icon={glance.icon}
                value={glance.value}
                label={glance.label}
                onClick={glance.onClick}
              />
            ))}
          </Card>
        </section>

        <BadgesSection badges={badges} onSeeAll={() => onOpenBadges?.()} />
        <AchievementsSection achievements={achievements} onSeeAll={() => onOpenAchievements?.()} />
      </div>
    </AppScreen>
  )
}

function StatGlance({
  icon,
  value,
  label,
  onClick,
}: {
  icon: ReactNode
  value: string
  label: string
  onClick?: () => void
}) {
  const body = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-control bg-info-surface text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[length:var(--p-text-sub)] font-bold leading-tight tabular-nums text-heading">
          {value}
        </span>
        <span className="block truncate text-[length:var(--p-text-tiny)] font-medium text-muted-foreground">
          {label}
        </span>
      </span>
      {onClick ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
    </>
  )
  const className = cn('flex items-center gap-2.5 bg-card p-3.5 text-left')
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(className, 'transition-colors active:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40')}
    >
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  )
}
