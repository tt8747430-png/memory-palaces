import { useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import {
  type AchievementId,
  cn,
  computeAchievements,
  computeTrainingTotals,
  isRoomCompleted,
  levelFromXp,
  totalTrainingDays,
} from '@/shared/lib'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { selectPalaces, usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { roomsForPalace, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { lociForRoom, selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import { AchievementGrid } from '@/widgets/achievement-list'
import { AppScreen, ScreenHeader, cardSurface } from '@/shared/ui'

export interface AchievementsPageProps {
  onBack?: () => void
  /** Open a milestone's "how to earn it" detail; wired by the route wrapper. */
  onOpenAchievement?: (id: AchievementId) => void
}

/** The Achievements screen: a compact grid of personal records (best-ever figures) over
 * the full milestone wall. Records and earned states derive live from the stores. Each
 * milestone taps through to its detail. Reached from the Profile "Achievements / See all". */
export function AchievementsPage({ onBack, onOpenAchievement }: AchievementsPageProps = {}) {
  const { t } = useTranslation()
  const progressStore = useProgressStoreApi()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const progress = useProgressStore(selectProgress)
  const palaces = usePalaceStore(selectPalaces)
  const rooms = useRoomStore(selectRooms)
  const loci = useLocusStore(selectLoci)

  useEffect(() => {
    progressStore.getState().start()
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
  }, [progressStore, palaceStore, roomStore, locusStore])

  const xp = progress?.xp ?? 0
  const totals = useMemo(() => computeTrainingTotals(rooms, loci), [rooms, loci])
  const daysTrained = useMemo(
    () => totalTrainingDays(progress?.trainingDays ?? []),
    [progress?.trainingDays],
  )
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
        streakCount: progress?.streakCount ?? 0,
        xp,
        bestQuizAccuracy: progress?.bestQuizAccuracy ?? 0,
        roomsCompleted: totals.roomsCompleted,
        anyPalaceCompleted,
      }),
    [palaces.length, progress, xp, totals.roomsCompleted, anyPalaceCompleted],
  )

  const records = [
    {
      id: 'level',
      value: String(levelFromXp(xp).level),
      label: t('achievementsPage.records.level'),
    },
    {
      id: 'streak',
      value: String(progress?.longestStreak ?? 0),
      label: t('achievementsPage.records.streak'),
    },
    {
      id: 'xp',
      value: xp.toLocaleString(),
      label: t('achievementsPage.records.xp'),
    },
    {
      id: 'accuracy',
      value: `${progress?.bestQuizAccuracy ?? 0}%`,
      label: t('achievementsPage.records.accuracy'),
    },
    {
      id: 'rooms',
      value: String(totals.roomsCompleted),
      label: t('achievementsPage.records.rooms'),
    },
    {
      id: 'days',
      value: String(daysTrained),
      label: t('achievementsPage.records.days'),
    },
  ]

  return (
    <AppScreen
      className="pb-28"
      header={
        <ScreenHeader
          title={t('achievementsPage.title')}
          onBack={onBack}
          backLabel={t('common.back')}
        />
      }
    >

      <div className="mt-2 flex flex-col gap-6">
        <section>
          <h2 className="mb-3 px-1 text-[length:var(--p-text-title)] font-bold text-heading">
            {t('achievementsPage.recordsTitle')}
          </h2>
          <motion.dl
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className={cn(cardSurface, 'grid grid-cols-3 overflow-hidden')}
          >
            {records.map((record, index) => (
              <div
                key={record.id}
                className={cn(
                  'flex flex-col-reverse items-center gap-1 px-2 py-5 text-center',
                  index % 3 !== 0 && 'border-l border-border',
                  index >= 3 && 'border-t border-border',
                )}
              >
                <dt className="text-[length:var(--p-text-label)] font-medium leading-tight text-muted-foreground">
                  {record.label}
                </dt>
                <dd className="text-[length:var(--p-text-headline)] font-bold leading-none tabular-nums text-heading">
                  {record.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </section>

        <section>
          <h2 className="mb-4 px-1 text-[length:var(--p-text-title)] font-bold text-heading">
            {t('achievementsPage.milestonesTitle')}
          </h2>
          <AchievementGrid achievements={achievements} onOpenAchievement={onOpenAchievement} />
        </section>
      </div>
    </AppScreen>
  )
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const
