import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  lociForRoom,
  selectIsReady as selectLociReady,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import {
  roomsForPalace,
  selectIsReady as selectRoomsReady,
  selectRooms,
  useRoomStore,
  useRoomStoreApi,
} from '@/entities/room'
import {
  type Palace,
  type PalaceSettings,
  selectIsReady as selectPalacesReady,
  usePalaceStore,
  usePalaceStoreApi,
} from '@/entities/palace'
import { editLocus } from '@/features/locus'
import { editPalace } from '@/features/palace'
import { gradeCard } from '@/features/review'
import { type StudyCard, type StudyPrefs, StudySession } from '@/widgets/study-session'
import { useSessionReward } from '@/widgets/session-reward'
import { AppScreen, ScreenHeader } from '@/shared/ui'

/** Study a single room's cards, or a whole palace's cards aggregated across its rooms. */
export type StudyScope = { kind: 'room'; roomId: string } | { kind: 'palace'; palaceId: string }

export interface StudyCardsPageProps {
  scope: StudyScope
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

/** The one flashcard study surface (ADR-0005). A full-featured spaced-review/browse session
 * over a scope's cards — one room or the whole palace. Opens in review mode (due cards lead);
 * every option lives in the in-session sheet. Study preferences seed from the palace and
 * persist back to it; grading runs through `gradeCard` so SRS schedules survive offline. */
export function StudyCardsPage({ scope, onBack }: StudyCardsPageProps) {
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

  const allLoci = useLocusStore(selectLoci)
  const allRooms = useRoomStore(selectRooms)
  const palaces = usePalaceStore((state) => state.palaces)
  const lociReady = useLocusStore(selectLociReady)
  const roomsReady = useRoomStore(selectRoomsReady)
  const palacesReady = usePalaceStore(selectPalacesReady)
  const ready = lociReady && roomsReady && palacesReady

  const room = useMemo(
    () =>
      scope.kind === 'room'
        ? allRooms.find((candidate) => candidate.id === scope.roomId)
        : undefined,
    [allRooms, scope],
  )
  const palaceId = scope.kind === 'palace' ? scope.palaceId : room?.palaceId
  const palace = useMemo(
    () => palaces.find((candidate) => candidate.id === palaceId),
    [palaces, palaceId],
  )

  const cards = useMemo<StudyCard[]>(() => {
    if (!palace) return []
    if (scope.kind === 'room') {
      const roomTitle = room?.title ?? ''
      return lociForRoom(allLoci, scope.roomId).map((locus) => ({
        locus,
        palaceName: palace.name,
        roomTitle,
      }))
    }
    const rooms = roomsForPalace(allRooms, scope.palaceId)
    return rooms.flatMap((each) =>
      lociForRoom(allLoci, each.id).map((locus) => ({
        locus,
        palaceName: palace.name,
        roomTitle: each.title,
      })),
    )
  }, [palace, room, allRooms, allLoci, scope])

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

  const missing = scope.kind === 'room' ? !room : !palace
  if (missing || !palace) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('study.notFound')} onBack={onBack} backLabel={t('study.back')} />
        }
      />
    )
  }

  const title = scope.kind === 'room' ? (room?.title ?? palace.name) : palace.name
  const subtitle = scope.kind === 'room' ? palace.name : t('study.palaceScope')

  return (
    <StudySession
      key={scope.kind === 'room' ? scope.roomId : scope.palaceId}
      cards={cards}
      title={title}
      subtitle={subtitle}
      initialPrefs={prefsFromSettings(palace.settings)}
      onPrefsChange={persistPrefs(palace)}
      onGrade={handleGrade}
      onToggleFlag={handleToggleFlag}
      onEditCard={(id, changes) => void editLocus(locusStore, id, changes)}
      onBack={onBack ?? (() => {})}
      onComplete={(summary) => {
        void reward({ kind: 'study', graded: summary.graded })
        onBack?.()
      }}
    />
  )
}
