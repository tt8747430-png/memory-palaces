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
import {
  usePalaceStore,
  usePalaceStoreApi,
  type Palace,
  type PalaceSettings,
} from '@/entities/palace'
import { editLocus } from '@/features/locus'
import { editPalace } from '@/features/palace'
import { gradeCard } from '@/features/review'
import { StudySession, type StudyCard, type StudyPrefs } from '@/widgets/study-session'
import { AppScreen, ScreenHeader } from '@/shared/ui'

export interface RoomTrainPageProps {
  roomId: string
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

function prefsFromSettings(settings: PalaceSettings): Partial<StudyPrefs> {
  return {
    mode: settings.studyMode,
    direction: settings.studyDirection,
    order: settings.cardOrder,
    shuffle: settings.shuffleCards,
    textToSpeech: settings.textToSpeech,
    sortIntoPiles: settings.sortIntoPiles,
  }
}

/** Room training — a single room's loci as a spaced-review/browse session. Study
 * preferences seed from the palace and persist back to it; grading runs through the
 * `gradeCard` command so SRS schedules survive offline. */
export function RoomTrainPage({ roomId, onBack }: RoomTrainPageProps) {
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

  const cards = useMemo<StudyCard[]>(
    () =>
      lociForRoom(allLoci, roomId).map((locus) => ({
        locus,
        palaceName: palace?.name ?? '',
        roomTitle: room?.title ?? '',
      })),
    [allLoci, roomId, palace?.name, room?.title],
  )

  const handleGrade = (id: string, grade: Parameters<typeof gradeCard>[2]) => {
    void gradeCard(locusStore, id, grade)
  }
  const handleToggleFlag = (id: string) => {
    const locus = locusStore.getState().loci.find((candidate) => candidate.id === id)
    if (locus) void editLocus(locusStore, id, { flagged: !locus.flagged })
  }
  const persistPrefs = (target: Palace) => (prefs: StudyPrefs) => {
    void editPalace(palaceStore, target.id, {
      settings: {
        ...target.settings,
        studyMode: prefs.mode,
        studyDirection: prefs.direction,
        cardOrder: prefs.order,
        shuffleCards: prefs.shuffle,
        textToSpeech: prefs.textToSpeech,
        sortIntoPiles: prefs.sortIntoPiles,
      },
    })
  }

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
        <ScreenHeader title={t('train.notFound')} onBack={onBack} backLabel={t('train.back')} />
      </AppScreen>
    )
  }

  return (
    <StudySession
      key={roomId}
      cards={cards}
      title={room.title}
      subtitle={palace?.name}
      initialPrefs={palace ? prefsFromSettings(palace.settings) : undefined}
      onPrefsChange={palace ? persistPrefs(palace) : undefined}
      onGrade={handleGrade}
      onToggleFlag={handleToggleFlag}
      onEditCard={(id, changes) => void editLocus(locusStore, id, changes)}
      onBack={onBack ?? (() => {})}
      onComplete={() => onBack?.()}
    />
  )
}
