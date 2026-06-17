import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { computeBadges, computeTrainingTotals, totalTrainingDays } from '@/shared/lib'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { selectPalaces, usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import { BadgeGrid } from '@/widgets/badge-list'
import { AppScreen, ScreenHeader } from '@/shared/ui'

export interface BadgesPageProps {
  onBack?: () => void
}

/** The full badge wall: every tiered badge resolved against live progress, earned tiers
 * in their color and locked ones greyscale. Reached from the Profile "Badges / See all". */
export function BadgesPage({ onBack }: BadgesPageProps = {}) {
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

  const totals = useMemo(() => computeTrainingTotals(rooms, loci), [rooms, loci])
  const badges = useMemo(
    () =>
      computeBadges({
        xp: progress?.xp ?? 0,
        longestStreak: progress?.longestStreak ?? 0,
        roomsCompleted: totals.roomsCompleted,
        palaceCount: palaces.length,
        totalCards: totals.totalCards,
        trainingDayCount: totalTrainingDays(progress?.trainingDays ?? []),
      }),
    [progress, totals, palaces.length],
  )
  const earned = badges.filter((badge) => badge.tier > 0).length

  return (
    <AppScreen className="pb-28">
      <ScreenHeader title={t('badges.title')} onBack={onBack} backLabel={t('common.back')} />

      <div className="mt-2 flex flex-col gap-5">
        <p className="px-1 text-[length:var(--p-text-label)] text-muted-foreground">
          {t('badges.subtitle', { earned, total: badges.length })}
        </p>
        <BadgeGrid badges={badges} />
      </div>
    </AppScreen>
  )
}
