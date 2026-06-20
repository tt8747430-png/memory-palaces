import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type BadgeId,
  computeBadges,
  computeTrainingTotals,
  nextMilestone,
  totalTrainingDays,
} from '@/shared/lib'
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
  selectIsReady as selectRoomsReady,
  selectRooms,
  useRoomStore,
  useRoomStoreApi,
} from '@/entities/room'
import {
  selectIsReady as selectLociReady,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import { BadgeGrid, NextMilestoneCard } from '@/widgets/badge-list'
import { AppScreen, ScreenHeader } from '@/shared/ui'

export interface BadgesPageProps {
  onBack?: () => void
  /** Open a badge's "how to earn it" detail; wired by the route wrapper. */
  onOpenBadge?: (id: BadgeId) => void
}

/** The full badge wall: every tiered badge resolved against live progress, earned tiers
 * in their color and not-yet-started ones dim. Leads with the nearest reachable target
 * so a new user sees a goal to chase, not a count of zeros. Each medallion taps through
 * to its detail. Reached from the Profile "Badges / See all". */
export function BadgesPage({ onBack, onOpenBadge }: BadgesPageProps = {}) {
  const { t } = useTranslation()
  const progressStore = useProgressStoreApi()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const progress = useProgressStore(selectProgress)
  const palaces = usePalaceStore(selectPalaces)
  const rooms = useRoomStore(selectRooms)
  const loci = useLocusStore(selectLoci)
  // Each store hook must run unconditionally (Rules of Hooks); combine after.
  const progressReady = useProgressStore(selectProgressReady)
  const palacesReady = usePalaceStore(selectPalacesReady)
  const roomsReady = useRoomStore(selectRoomsReady)
  const lociReady = useLocusStore(selectLociReady)
  const dataReady = progressReady && palacesReady && roomsReady && lociReady

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
  const milestone = useMemo(() => nextMilestone(badges), [badges])

  return (
    <AppScreen
      fill
      className="pb-28"
      header={
        <ScreenHeader title={t('badges.title')} onBack={onBack} backLabel={t('common.back')} />
      }
    >
      {!dataReady ? (
        <BadgesSkeleton />
      ) : (
        <div className="mt-2 flex flex-col gap-5">
          <p className="px-1 text-[length:var(--p-text-label)] text-muted-foreground">
            {t('badges.explainer')}
          </p>
          {milestone ? (
            <NextMilestoneCard badge={milestone} onOpen={() => onOpenBadge?.(milestone.id)} />
          ) : null}
          <BadgeGrid badges={badges} onOpenBadge={onOpenBadge} />
        </div>
      )}
    </AppScreen>
  )
}

function BadgesSkeleton() {
  return (
    <div aria-hidden className="mt-2 flex flex-col gap-5">
      <div className="h-3 w-44 animate-pulse rounded-full bg-secondary/30" />
      <div className="h-20 animate-pulse rounded-card bg-secondary/30" />
      <div className="grid grid-cols-3 gap-x-3 gap-y-7">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div className="size-20 animate-pulse rounded-full bg-secondary/30" />
            <div className="h-2.5 w-12 animate-pulse rounded-full bg-secondary/20" />
          </div>
        ))}
      </div>
    </div>
  )
}
