import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { BarChart3, BookOpen, ChevronRight, Flame, Target, TrendingUp, Trophy, Zap } from 'lucide-react'
import { cn, computeAchievements, computeTrainingTotals, isRoomCompleted } from '@/shared/lib'
import { useSessionStore } from '@/entities/session'
import { selectEffectiveProfile, useProfileStore, useProfileStoreApi } from '@/entities/profile'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { selectPalaces, usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { roomsForPalace, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { lociForRoom, selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import { ProfileHeader } from '@/widgets/profile-header'
import { AchievementList } from '@/widgets/achievement-list'
import { AppScreen, SegmentedControl, StatTile, cardSurface } from '@/shared/ui'

export interface ProfilePageProps {
  /** Open the settings screen; wired by the route wrapper. */
  onOpenSettings?: () => void
  /** Open the full Stats screen ("View full stats"); wired by the route wrapper. */
  onOpenStats?: () => void
}

type ProfileTab = 'statistics' | 'achievements'

const TILE_ICON = 'size-[22px]'

/** Profile tab. A guest identity today (account claim is Phase 9); everything below the
 * hero is derived live from the progress/palace/room/locus stores — a stat glance and a
 * badge wall — with a deeper breakdown one tap away on the Stats screen. */
export function ProfilePage({ onOpenSettings, onOpenStats }: ProfilePageProps = {}) {
  const { t } = useTranslation()
  const session = useSessionStore((state) => state.session)
  const profileStore = useProfileStoreApi()
  const profile = useProfileStore(selectEffectiveProfile)
  const progressStore = useProgressStoreApi()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const progress = useProgressStore(selectProgress)
  const palaces = usePalaceStore(selectPalaces)
  const rooms = useRoomStore(selectRooms)
  const loci = useLocusStore(selectLoci)
  const [tab, setTab] = useState<ProfileTab>('statistics')

  useEffect(() => {
    profileStore.getState().start()
    progressStore.getState().start()
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
  }, [profileStore, progressStore, palaceStore, roomStore, locusStore])

  const name = profile.name.trim() || session?.displayName || 'Guest'
  const xp = progress?.xp ?? 0
  const streakCount = progress?.streakCount ?? 0
  const longestStreak = progress?.longestStreak ?? 0
  const bestQuizAccuracy = progress?.bestQuizAccuracy ?? 0

  const totals = useMemo(() => computeTrainingTotals(rooms, loci), [rooms, loci])
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

  const tiles = [
    { icon: <Zap className={TILE_ICON} />, value: xp.toLocaleString(), label: t('profile.tiles.totalXp') },
    { icon: <Flame className={TILE_ICON} />, value: String(streakCount), label: t('profile.tiles.currentStreak') },
    { icon: <Trophy className={TILE_ICON} />, value: String(longestStreak), label: t('profile.tiles.longestStreak') },
    { icon: <BookOpen className={TILE_ICON} />, value: String(palaces.length), label: t('profile.tiles.palaces') },
    { icon: <TrendingUp className={TILE_ICON} />, value: String(totals.roomsCompleted), label: t('profile.tiles.roomsDone') },
    { icon: <Target className={TILE_ICON} />, value: `${bestQuizAccuracy}%`, label: t('profile.tiles.bestAccuracy') },
  ]

  return (
    <AppScreen className="pb-nav">
      <ProfileHeader
        name={name}
        avatar={profile.avatar}
        xp={xp}
        palaceCount={palaces.length}
        streakCount={streakCount}
        onOpenSettings={() => onOpenSettings?.()}
      />

      <SegmentedControl<ProfileTab>
        className="mt-8"
        aria-label={t('profile.statistics')}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'statistics', label: t('profile.statistics') },
          { value: 'achievements', label: t('profile.achievements') },
        ]}
      />

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6"
      >
        {tab === 'statistics' ? (
          <section>
            <h2 className="mb-3 px-1 text-[length:var(--p-text-title)] font-bold text-heading">
              {t('profile.journey')}
            </h2>
            <div className="grid grid-cols-2 gap-3.5">
              {tiles.map((tile, index) => (
                <StatTile
                  key={tile.label}
                  icon={tile.icon}
                  value={tile.value}
                  label={tile.label}
                  delay={index * 0.04}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => onOpenStats?.()}
              className={cn(
                cardSurface,
                'mt-3.5 flex w-full items-center gap-3.5 p-4 text-left transition-transform active:scale-[0.99]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              )}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-control bg-info-surface text-primary">
                <BarChart3 className={TILE_ICON} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-heading">{t('profile.viewFullStats')}</span>
                <span className="block text-[length:var(--p-text-label)] font-medium text-muted-foreground">
                  {t('profile.viewFullStatsHint')}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </section>
        ) : (
          <AchievementList achievements={achievements} />
        )}
      </motion.div>
    </AppScreen>
  )
}
