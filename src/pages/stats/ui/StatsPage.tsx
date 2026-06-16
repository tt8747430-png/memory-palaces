import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, CalendarCheck, Flame, Layers, Target, TrendingUp } from 'lucide-react'
import { computeTrainingTotals, countDueLoci, totalTrainingDays } from '@/shared/lib'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { selectPalaces, usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import { StreakSummary } from '@/widgets/streak-summary'
import { StreakCalendar } from '@/widgets/streak-calendar'
import { AppScreen, ScreenHeader, StatTile } from '@/shared/ui'

export interface StatsPageProps {
  /** Return to the Profile tab; wired by the route wrapper. */
  onBack?: () => void
}

const TILE_ICON = 'size-[22px]'

/** The full stats screen: the single home for detailed numbers. A streak/level hero
 * (StreakSummary) over a six-tile breakdown and the month training calendar — every
 * figure derived live from the stores, never stored or faked. */
export function StatsPage({ onBack }: StatsPageProps = {}) {
  const { t } = useTranslation()
  const progressStore = useProgressStoreApi()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const progress = useProgressStore(selectProgress)
  const palaces = usePalaceStore(selectPalaces)
  const rooms = useRoomStore(selectRooms)
  const loci = useLocusStore(selectLoci)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    progressStore.getState().start()
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
  }, [progressStore, palaceStore, roomStore, locusStore])

  const trainingDays = progress?.trainingDays ?? []
  const totals = useMemo(() => computeTrainingTotals(rooms, loci), [rooms, loci])
  const dueToday = useMemo(
    () => countDueLoci(palaces, rooms, loci, now),
    [palaces, rooms, loci, now],
  )

  const tiles = [
    { icon: <CalendarCheck className={TILE_ICON} />, value: String(totalTrainingDays(trainingDays)), label: t('stats.daysTrained') },
    { icon: <TrendingUp className={TILE_ICON} />, value: String(totals.roomsCompleted), label: t('stats.roomsCompleted') },
    { icon: <BookOpen className={TILE_ICON} />, value: String(palaces.length), label: t('stats.palaces') },
    { icon: <Layers className={TILE_ICON} />, value: String(totals.totalCards), label: t('stats.cards') },
    { icon: <Flame className={TILE_ICON} />, value: String(dueToday), label: t('stats.dueToday') },
    { icon: <Target className={TILE_ICON} />, value: `${progress?.bestQuizAccuracy ?? 0}%`, label: t('stats.bestQuiz') },
  ]

  return (
    <AppScreen className="pb-28">
      <ScreenHeader title={t('stats.title')} onBack={onBack} backLabel={t('stats.back')} />

      <div className="mt-2 flex flex-col gap-6">
        <StreakSummary
          showProgress
          xp={progress?.xp ?? 0}
          streakCount={progress?.streakCount ?? 0}
          longestStreak={progress?.longestStreak ?? 0}
          trainingDays={trainingDays}
        />

        <section>
          <h2 className="mb-3 px-1 text-[length:var(--p-text-title)] font-bold text-heading">
            {t('stats.journey')}
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
        </section>

        <section>
          <h2 className="mb-3 px-1 text-[length:var(--p-text-title)] font-bold text-heading">
            {t('stats.calendar')}
          </h2>
          <StreakCalendar trainingDays={trainingDays} />
        </section>
      </div>
    </AppScreen>
  )
}
