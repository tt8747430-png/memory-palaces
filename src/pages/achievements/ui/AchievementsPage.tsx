import { type ReactNode, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flame, Gauge, Sparkles, Zap } from 'lucide-react'
import {
  computeAchievements,
  computeTrainingTotals,
  isRoomCompleted,
  levelFromXp,
} from '@/shared/lib'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { selectPalaces, usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { roomsForPalace, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { lociForRoom, selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import { AchievementGrid } from '@/widgets/achievement-list'
import { AppScreen, Card, ScreenHeader } from '@/shared/ui'

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
  ]

  return (
    <AppScreen className="pb-28">
      <ScreenHeader title={t('achievementsPage.title')} onBack={onBack} backLabel={t('common.back')} />

      <div className="mt-2 flex flex-col gap-6">
        <section>
          <h2 className="mb-3 px-1 text-[length:var(--p-text-title)] font-bold text-heading">
            {t('achievementsPage.recordsTitle')}
          </h2>
          <ul className="-mx-5 flex gap-3 overflow-x-auto scroll-px-5 px-5 pb-1 scrollbar-hide [scroll-snap-type:x_mandatory]">
            {records.map((record) => (
              <li key={record.id} className="shrink-0 [scroll-snap-align:start]">
                <RecordCard icon={record.icon} value={record.value} label={record.label} />
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

function RecordCard({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <Card className="flex w-32 flex-col gap-3 p-4">
      <span className="grid size-10 place-items-center rounded-control bg-info-surface text-primary">
        {icon}
      </span>
      <div>
        <p className="truncate text-[length:var(--p-text-headline)] font-bold leading-none tabular-nums text-heading">
          {value}
        </p>
        <p className="mt-1.5 text-[length:var(--p-text-label)] font-medium leading-tight text-muted-foreground">
          {label}
        </p>
      </div>
    </Card>
  )
}
