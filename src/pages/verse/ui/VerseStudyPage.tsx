import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { verseText } from '@/shared/lib'
import {
  lociForRoom,
  selectIsReady,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import { useRoomStore, useRoomStoreApi } from '@/entities/room'
import { usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { editLocus } from '@/features/locus'
import { VerseStudy, type VerseCard } from '@/widgets/verse'
import { AppScreen, ScreenHeader } from '@/shared/ui'

export interface VerseStudyPageProps {
  roomId: string
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

/** Verse study — a room's loci as memorizable verses (`front` reference, `back`
 * text). The memorized marker is the only write, through the existing `editLocus`
 * command; the recall modes are read-only. */
export function VerseStudyPage({ roomId, onBack }: VerseStudyPageProps) {
  const { t } = useTranslation()
  const locusStore = useLocusStoreApi()
  const roomStore = useRoomStoreApi()
  const palaceStore = usePalaceStoreApi()

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

  const verses = useMemo<VerseCard[]>(
    () =>
      lociForRoom(allLoci, roomId).map((locus) => ({
        id: locus.id,
        reference: locus.front,
        text: verseText(locus),
        memorized: locus.memorized,
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
      <AppScreen
        header={
          <ScreenHeader title={t('train.notFound')} onBack={onBack} backLabel={t('verse.back')} />
        }
      />
    )
  }

  const handleToggleMemorized = (id: string) => {
    const locus = locusStore.getState().loci.find((candidate) => candidate.id === id)
    if (locus) void editLocus(locusStore, id, { memorized: !locus.memorized })
  }

  return (
    <VerseStudy
      key={roomId}
      verses={verses}
      title={room.title}
      subtitle={palace?.name}
      onBack={onBack ?? (() => {})}
      onToggleMemorized={handleToggleMemorized}
    />
  )
}
