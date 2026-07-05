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
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { editLocus } from '@/features/locus'
import { editPalace } from '@/features/palace'
import { gradeCard } from '@/features/review'
import { setPreferences } from '@/features/preferences'
import { type StudyCard, type StudyPrefs, FlashcardsPanel } from '@/widgets/study-session'
import { type VerseCard, VersePanel, type VerseStudyPrefs } from '@/widgets/verse'
import { useSessionReward } from '@/widgets/session-reward'
import { verseText } from '@/shared/lib'
import { AppScreen, Button, IconButton, ScreenHeader, SegmentedControl } from '@/shared/ui'

/** Study a single room's cards, or a whole palace's cards aggregated across its rooms. */
export type StudyScope = { kind: 'room'; roomId: string } | { kind: 'palace'; palaceId: string }

/** Flashcard review vs. verse memorization — the two ways to work a scope's loci. */
type StudyType = 'flashcards' | 'verses'

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

/** The one study surface (ADR-0005): a scope's loci worked either as a spaced-review flashcard
 * deck or memorized as verses, switched at the top. Flashcard prefs seed from and persist to
 * the palace; the verse mode and swipe map are global preferences; grading runs through
 * `gradeCard` so SRS schedules survive offline. */
export function StudyCardsPage({ scope, onBack }: StudyCardsPageProps) {
  const { t } = useTranslation()
  const locusStore = useLocusStoreApi()
  const roomStore = useRoomStoreApi()
  const palaceStore = usePalaceStoreApi()
  const preferencesStore = usePreferencesStoreApi()
  const reward = useSessionReward()

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

  const [studyType, setStudyType] = useState<StudyType>('flashcards')
  const [optionsOpen, setOptionsOpen] = useState(false)

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

  const verses = useMemo<VerseCard[]>(() => {
    const toVerses = (roomId: string) =>
      lociForRoom(allLoci, roomId).map((locus) => ({
        id: locus.id,
        reference: locus.front,
        text: verseText(locus),
        memorized: locus.memorized,
      }))
    if (scope.kind === 'room') return toVerses(scope.roomId)
    return roomsForPalace(allRooms, scope.palaceId).flatMap((each) => toVerses(each.id))
  }, [allLoci, allRooms, scope])

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

  const handleToggleMemorized = (id: string) => {
    const locus = locusStore.getState().loci.find((candidate) => candidate.id === id)
    if (!locus) return
    const nowMemorized = !locus.memorized
    void editLocus(locusStore, id, { memorized: nowMemorized })
    if (nowMemorized) void reward({ kind: 'verse', memorized: 1 })
  }
  const handleEditVerse = (id: string, changes: { front: string; back: string }) => {
    void editLocus(locusStore, id, changes)
  }
  const versePrefs: VerseStudyPrefs = {
    mode: preferences.verseMode,
    shuffle: preferences.verseShuffle,
    wordSpaces: preferences.verseWordSpaces,
  }
  const handleVersePrefsChange = (changes: Partial<VerseStudyPrefs>) => {
    void setPreferences(preferencesStore, {
      ...(changes.mode !== undefined ? { verseMode: changes.mode } : {}),
      ...(changes.shuffle !== undefined ? { verseShuffle: changes.shuffle } : {}),
      ...(changes.wordSpaces !== undefined ? { verseWordSpaces: changes.wordSpaces } : {}),
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
  const scopeKey = scope.kind === 'room' ? scope.roomId : scope.palaceId
  const back = onBack ?? (() => {})

  // A scope with no authored cards: a real empty state, not a switch over nothing.
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

  const switchType = (next: StudyType) => {
    setStudyType(next)
    setOptionsOpen(false)
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden">
      <div className="px-5 pt-safe">
        <div className="mb-3 flex items-center justify-between pt-3">
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
          <IconButton
            variant="glass"
            aria-label={studyType === 'flashcards' ? t('study.options') : t('verse.settings')}
            onClick={() => setOptionsOpen(true)}
          >
            <SlidersHorizontal className="size-5" aria-hidden />
          </IconButton>
        </div>

        <SegmentedControl
          value={studyType}
          options={[
            { value: 'flashcards', label: t('study.typeFlashcards') },
            { value: 'verses', label: t('study.typeVerses') },
          ]}
          onChange={switchType}
          layoutId="studyTypeSwitch"
          aria-label={t('study.typeSwitch')}
        />
      </div>

      {studyType === 'flashcards' ? (
        <FlashcardsPanel
          key={`flashcards-${scopeKey}`}
          cards={cards}
          prefs={studyPrefsFromSettings(palace.settings)}
          swipeConfig={preferences.flashcardSwipe}
          onPrefsChange={persistStudyPrefs(palace)}
          onSwipeConfigChange={persistSwipe}
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
        />
      ) : (
        <VersePanel
          key={`verses-${scopeKey}`}
          verses={verses}
          prefs={versePrefs}
          onPrefsChange={handleVersePrefsChange}
          onBack={back}
          onToggleMemorized={handleToggleMemorized}
          onEditVerse={handleEditVerse}
          settingsOpen={optionsOpen}
          onSettingsOpenChange={setOptionsOpen}
        />
      )}
    </div>
  )
}
