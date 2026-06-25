import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  lociForRoom,
  selectIsReady,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import { roomsForPalace, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { MatchBoard } from '@/widgets/match'
import { type MatchLocus } from '@/features/match'
import { useSessionReward } from '@/widgets/session-reward'
import { AppScreen, ScreenHeader } from '@/shared/ui'

/** Match a single room's cards, or a whole palace's cards aggregated across its rooms. */
export type MatchScope = { kind: 'room'; roomId: string } | { kind: 'palace'; palaceId: string }

export interface MatchPageProps {
  scope: MatchScope
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

/** Match game over a scope's loci — tap term/definition pairs to clear the board.
 * Read-only: it never grades or schedules, so no command is needed. */
export function MatchPage({ scope, onBack }: MatchPageProps) {
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

  const allRooms = useRoomStore(selectRooms)
  const room = useMemo(
    () =>
      scope.kind === 'room'
        ? allRooms.find((candidate) => candidate.id === scope.roomId)
        : undefined,
    [allRooms, scope],
  )
  const palaceId = scope.kind === 'palace' ? scope.palaceId : room?.palaceId
  const palace = usePalaceStore((state) =>
    state.palaces.find((candidate) => candidate.id === palaceId),
  )
  const allLoci = useLocusStore(selectLoci)
  const ready = useLocusStore(selectIsReady)

  const loci = useMemo<MatchLocus[]>(() => {
    const toMatch = (id: string) =>
      lociForRoom(allLoci, id).map((locus) => ({
        id: locus.id,
        front: locus.front,
        back: locus.back,
      }))
    if (scope.kind === 'room') return toMatch(scope.roomId)
    return roomsForPalace(allRooms, scope.palaceId).flatMap((each) => toMatch(each.id))
  }, [allLoci, allRooms, scope])

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  const missing = scope.kind === 'room' ? !room : !palace
  if (missing) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('train.notFound')} onBack={onBack} backLabel={t('match.back')} />
        }
      />
    )
  }

  const subtitle =
    scope.kind === 'room'
      ? palace
        ? `${room?.title} · ${palace.name}`
        : (room?.title ?? '')
      : (palace?.name ?? '')

  return (
    <MatchBoard
      key={scope.kind === 'room' ? scope.roomId : scope.palaceId}
      loci={loci}
      subtitle={subtitle}
      onBack={onBack ?? (() => {})}
      onComplete={() => {
        void reward({ kind: 'match', pairs: loci.length })
        onBack?.()
      }}
    />
  )
}
