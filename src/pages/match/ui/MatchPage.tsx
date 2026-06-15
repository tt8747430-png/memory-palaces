import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  lociForRoom,
  selectIsReady,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import { useRoomStore, useRoomStoreApi } from '@/entities/room'
import { usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { MatchBoard } from '@/widgets/match'
import { type MatchLocus } from '@/features/match'
import { XP_MATCH } from '@/features/progress'
import { useSessionReward } from '@/widgets/session-reward'
import { AppScreen, ScreenHeader } from '@/shared/ui'

export interface MatchPageProps {
  roomId: string
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

/** Match game over a single room's loci — tap term/definition pairs to clear the
 * board. Read-only: it never grades or schedules, so no command is needed. */
export function MatchPage({ roomId, onBack }: MatchPageProps) {
  const { t } = useTranslation()
  const locusStore = useLocusStoreApi()
  const roomStore = useRoomStoreApi()
  const palaceStore = usePalaceStoreApi()
  const reward = useSessionReward()

  useEffect(() => {
    locusStore.getState().start()
    roomStore.getState().start()
    palaceStore.getState().start()
  }, [locusStore, roomStore, palaceStore])

  const room = useRoomStore((state) => state.rooms.find((candidate) => candidate.id === roomId))
  const palace = usePalaceStore((state) =>
    room ? state.palaces.find((candidate) => candidate.id === room.palaceId) : undefined,
  )
  const allLoci = useLocusStore(selectLoci)
  const ready = useLocusStore(selectIsReady)

  const loci = useMemo<MatchLocus[]>(
    () =>
      lociForRoom(allLoci, roomId).map((locus) => ({
        id: locus.id,
        front: locus.front,
        back: locus.back,
      })),
    [allLoci, roomId],
  )

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  if (!room) {
    return (
      <AppScreen>
        <ScreenHeader title={t('train.notFound')} onBack={onBack} backLabel={t('match.back')} />
      </AppScreen>
    )
  }

  const subtitle = palace ? `${room.title} · ${palace.name}` : room.title

  return (
    <MatchBoard
      key={roomId}
      loci={loci}
      subtitle={subtitle}
      onBack={onBack ?? (() => {})}
      onComplete={() => {
        void reward({ xp: XP_MATCH })
        onBack?.()
      }}
    />
  )
}
