import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Layers, SlidersHorizontal } from 'lucide-react'
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
import {
  type FlashcardSwipeConfig,
  selectEffectivePreferences,
  type StudyMode,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { editLocus } from '@/features/locus'
import { editPalace } from '@/features/palace'
import { gradeCard } from '@/features/review'
import { setPreferences } from '@/features/preferences'
import {
  type StudyCard,
  type StudyPrefs,
  FlashcardsPanel,
  STUDY_MODE_META,
} from '@/widgets/study-session'
import { useSessionReward } from '@/widgets/session-reward'
import { useViewportHeight } from '@/shared/lib'
import { AppScreen, Button, IconButton, ScreenHeader } from '@/shared/ui'

/** Study a single room's cards, or a whole palace's cards aggregated across its rooms. */
export type StudyScope = { kind: 'room'; roomId: string } | { kind: 'palace'; palaceId: string }

export interface StudyCardsPageProps {
  scope: StudyScope
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

function studyPrefsFromSettings(settings: PalaceSettings): StudyPrefs {
  return {
    direction: settings.studyDirection,
    shuffle: settings.shuffleCards,
    textToSpeech: settings.textToSpeech,
  }
}

/** The one study surface (ADR-0005): a scope's loci worked as a single spaced-review deck.
 * Always opens in flip; the other study modes (type / initials / blur / rebuild) switch in
 * through the header mode button, and every mode grades through `gradeCard`, so SRS
 * schedules survive offline. Flashcard orientation/shuffle/speech seed from and persist to
 * the palace; mode switches are recorded to global preferences. */
export function StudyCardsPage({ scope, onBack }: StudyCardsPageProps) {
  const { t } = useTranslation()
  const locusStore = useLocusStoreApi()
  const roomStore = useRoomStoreApi()
  const palaceStore = usePalaceStoreApi()
  const preferencesStore = usePreferencesStoreApi()
  const reward = useSessionReward()
  // The app shell is fixed to the layout viewport, so it doesn't shrink for the keyboard. This
  // surface owns an inline text field (Type mode), so it sizes itself to the *visual* viewport —
  // the header, deck, and grade controls compress above the keyboard instead of being pushed off.
  const viewportHeight = useViewportHeight()

  useEffect(() => {
    locusStore.getState().start()
    roomStore.getState().start()
    palaceStore.getState().start()
    preferencesStore.getState().start()
  }, [locusStore, roomStore, palaceStore, preferencesStore])

  const allLoci = useLocusStore(selectLoci)
  const allRooms = useRoomStore(selectRooms)
  const palaces = usePalaceStore((state) => state.palaces)
  const preferences = usePreferencesStore(selectEffectivePreferences)
  const lociReady = useLocusStore(selectLociReady)
  const roomsReady = useRoomStore(selectRoomsReady)
  const palacesReady = usePalaceStore(selectPalacesReady)
  const ready = lociReady && roomsReady && palacesReady

  const [optionsOpen, setOptionsOpen] = useState(false)
  const [modeSheetOpen, setModeSheetOpen] = useState(false)
  const [mode, setMode] = useState<StudyMode>('flip')

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
    return roomsForPalace(allRooms, scope.palaceId).flatMap((each) =>
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
  const persistStudyPrefs = (target: Palace) => (prefs: StudyPrefs) => {
    void editPalace(palaceStore, target.id, {
      settings: {
        ...target.settings,
        studyDirection: prefs.direction,
        shuffleCards: prefs.shuffle,
        textToSpeech: prefs.textToSpeech,
      },
    })
  }
  const persistSwipe = (config: FlashcardSwipeConfig) =>
    void setPreferences(preferencesStore, { flashcardSwipe: config })
  const changeMode = (next: StudyMode) => {
    setMode(next)
    void setPreferences(preferencesStore, { studyMode: next })
  }
  const persistWordSpaces = (value: boolean) =>
    void setPreferences(preferencesStore, { studyWordSpaces: value })

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
  const scopeKey = scope.kind === 'room' ? scope.roomId : scope.palaceId
  const back = onBack ?? (() => {})
  const ModeIcon = STUDY_MODE_META[mode].Icon

  // A scope with no authored cards: a real empty state, not a deck over nothing.
  if (cards.length === 0) {
    return (
      <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="grid size-16 place-items-center rounded-card-featured bg-info-surface">
          <Layers className="size-8 text-accent" aria-hidden />
        </div>
        <div>
          <h2 className="mb-1 text-[length:var(--p-text-headline)] font-bold text-heading">
            {t('study.noCards')}
          </h2>
          <p className="mx-auto max-w-[34ch] text-[length:var(--p-text-body)]">
            {t('study.noCardsHint', { room: title })}
          </p>
        </div>
        <Button onClick={back}>{t('study.backToRoom')}</Button>
      </div>
    )
  }

  return (
    <div
      className="relative mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden"
      style={viewportHeight ? { height: `${viewportHeight}px` } : undefined}
    >
      <div className="px-5 pt-safe">
        <div className="flex items-center justify-between pt-3">
          <IconButton variant="glass" aria-label={t('study.goBack')} onClick={back}>
            <ChevronLeft className="size-5" aria-hidden />
          </IconButton>
          <div className="mx-4 min-w-0 flex-1 text-center">
            <h1 className="truncate text-[length:var(--p-text-title)] font-semibold text-heading">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-[length:var(--p-text-label)]">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-0.5">
            <IconButton
              variant="glass"
              aria-label={t('study.changeMode')}
              onClick={() => setModeSheetOpen(true)}
            >
              <ModeIcon className="size-5" aria-hidden />
            </IconButton>
            <IconButton
              variant="glass"
              aria-label={t('study.options')}
              onClick={() => setOptionsOpen(true)}
            >
              <SlidersHorizontal className="size-5" aria-hidden />
            </IconButton>
          </div>
        </div>
      </div>

      <FlashcardsPanel
        key={`flashcards-${scopeKey}`}
        cards={cards}
        prefs={studyPrefsFromSettings(palace.settings)}
        mode={mode}
        wordSpaces={preferences.studyWordSpaces}
        swipeConfig={preferences.flashcardSwipe}
        onPrefsChange={persistStudyPrefs(palace)}
        onSwipeConfigChange={persistSwipe}
        onModeChange={changeMode}
        onWordSpacesChange={persistWordSpaces}
        onGrade={handleGrade}
        onToggleFlag={handleToggleFlag}
        onEditCard={(id, changes) => void editLocus(locusStore, id, changes)}
        onBack={back}
        onComplete={(summary) => {
          void reward({ kind: 'study', graded: summary.graded })
          back()
        }}
        optionsOpen={optionsOpen}
        onOptionsOpenChange={setOptionsOpen}
        modeSheetOpen={modeSheetOpen}
        onModeSheetOpenChange={setModeSheetOpen}
      />
    </div>
  )
}
