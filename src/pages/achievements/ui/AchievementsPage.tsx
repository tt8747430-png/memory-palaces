import { type ReactNode, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { CalendarCheck, DoorOpen, Flame, Gauge, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/shared/lib'
import {
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
import { AppScreen, ScreenHeader } from '@/shared/ui'

export interface AchievementsPageProps {
  onBack?: () => void
}

/** The Achievements screen: a row of personal records (best-ever figures) over the full
 * milestone wall. Records and earned states derive live from the stores. Reached from
 * the Profile "Achievements / See all". */
export function AchievementsPage({ onBack }: AchievementsPageProps = {}) {
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
      featured: true,
      icon: <Sparkles className="size-5" aria-hidden />,
      value: t('progress.level', { level: levelFromXp(xp).level }),
      label: t('achievementsPage.records.level'),
    },
    {
      id: 'streak',
      icon: <Flame className="size-5" fill="currentColor" aria-hidden />,
      value: String(progress?.longestStreak ?? 0),
      label: t('achievementsPage.records.streak'),
    },
    {
      id: 'xp',
      icon: <Zap className="size-5" fill="currentColor" aria-hidden />,
      value: xp.toLocaleString(),
      label: t('achievementsPage.records.xp'),
    },
    {
      id: 'accuracy',
      icon: <Gauge className="size-5" aria-hidden />,
      value: `${progress?.bestQuizAccuracy ?? 0}%`,
      label: t('achievementsPage.records.accuracy'),
    },
    {
      id: 'rooms',
      icon: <DoorOpen className="size-5" aria-hidden />,
      value: String(totals.roomsCompleted),
      label: t('achievementsPage.records.rooms'),
    },
    {
      id: 'days',
      icon: <CalendarCheck className="size-5" aria-hidden />,
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
          <ul className="-mx-5 flex gap-3 overflow-x-auto scroll-px-5 px-5 pb-1 scrollbar-hide [scroll-snap-type:x_mandatory]">
            {records.map((record, index) => (
              <li key={record.id} className="shrink-0 [scroll-snap-align:start]">
                <RecordCard
                  index={index}
                  featured={record.featured}
                  icon={record.icon}
                  value={record.value}
                  label={record.label}
                />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 px-1 text-[length:var(--p-text-title)] font-bold text-heading">
            {t('achievementsPage.milestonesTitle')}
          </h2>
          <AchievementGrid achievements={achievements} />
        </section>
      </div>
    </AppScreen>
  )
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** A single best-ever figure. The headline record (Level) renders as a drenched
 * navy→action-blue tile with a frosted icon chip; the rest are calm white cards with a
 * gradient-tinted medallion. The variance gives the row a clear lead instead of a flat
 * strip of identical tiles, and each tile springs in on a short stagger. */
function RecordCard({
  index,
  featured = false,
  icon,
  value,
  label,
}: {
  index: number
  featured?: boolean
  icon: ReactNode
  value: string
  label: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 + index * 0.05, duration: 0.4, ease: EASE_OUT }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative flex h-full flex-col gap-3 overflow-hidden p-4',
        featured
          ? 'w-36 rounded-card-featured text-primary-foreground shadow-featured'
          : 'w-32 rounded-card bg-card shadow-rest',
      )}
      style={
        featured
          ? { background: 'linear-gradient(135deg, var(--primary), var(--accent))' }
          : undefined
      }
    >
      {featured ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent"
        />
      ) : null}
      <span
        className={cn(
          'relative grid size-10 place-items-center rounded-control',
          featured
            ? 'bg-white/20 text-primary-foreground backdrop-blur-sm'
            : 'bg-gradient-to-br from-secondary/55 to-info-surface text-primary',
        )}
      >
        {icon}
      </span>
      <div className="relative">
        <p
          className={cn(
            'truncate text-[length:var(--p-text-headline)] font-bold leading-none tabular-nums',
            featured ? 'text-primary-foreground' : 'text-heading',
          )}
        >
          {value}
        </p>
        <p
          className={cn(
            'mt-1.5 text-[length:var(--p-text-label)] font-medium leading-tight',
            featured ? 'text-primary-foreground/80' : 'text-muted-foreground',
          )}
        >
          {label}
        </p>
      </div>
    </motion.div>
  )
}
