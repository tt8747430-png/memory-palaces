import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Settings2 } from 'lucide-react'
import {
  selectIsReady as selectPalacesReady,
  usePalaceStore,
  usePalaceStoreApi,
} from '@/entities/palace'
import { selectIsReady as selectRoomsReady, useRoomStore, useRoomStoreApi } from '@/entities/room'
import {
  lociForRoom,
  selectIsReady as selectLociReady,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import {
  questionsForRoom,
  selectIsReady as selectQuestionsReady,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import {
  type ContentSort,
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'
import { studyOverview } from '@/shared/lib'
import { RoomContentEditor } from '@/widgets/loci-editor'
import { PracticeModes } from '@/widgets/practice-modes'
import {
  AppScreen,
  IconButton,
  ScreenHeader,
  StudyOverviewCard,
  TextField,
} from '@/shared/ui'

export interface RoomHubPageProps {
  roomId: string
  onBack?: () => void
  /** Open the room's settings page (rename, duplicate, reset, delete). */
  onOpenSettings?: () => void
  /** Open the room's Study-cards session (the one flashcard surface). */
  onStudy?: () => void
  /** Launch the Match mini-game. */
  onMatch?: () => void
  /** Open the room's Questions & Test page (author questions, then start the test). */
  onTest?: () => void
  /** Launch verse-study. */
  onVerse?: () => void
  /** Open the full-screen card editor (add / edit). */
  onAddCard: () => void
  onEditCard: (cardId: string) => void
}

/** The room hub — one screen per room: a card preview, then the study overview, then the
 * practice modes, then the room's cards-and-questions editor inline below (one scroll,
 * study on top, manage beneath). */
export function RoomHubPage({
  roomId,
  onBack,
  onOpenSettings,
  onStudy,
  onMatch,
  onTest,
  onVerse,
  onAddCard,
  onEditCard,
}: RoomHubPageProps) {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()
  const prefStore = usePreferencesStoreApi()

  useEffect(() => {
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
    questionStore.getState().start()
    prefStore.getState().start()
  }, [palaceStore, roomStore, locusStore, questionStore, prefStore])

  const room = useRoomStore((state) => state.rooms.find((candidate) => candidate.id === roomId))
  const palace = usePalaceStore((state) =>
    state.palaces.find((candidate) => candidate.id === room?.palaceId),
  )
  const allLoci = useLocusStore(selectLoci)
  const allQuestions = useQuestionStore(selectQuestions)
  const palacesReady = usePalaceStore(selectPalacesReady)
  const roomsReady = useRoomStore(selectRoomsReady)
  const lociReady = useLocusStore(selectLociReady)
  const questionsReady = useQuestionStore(selectQuestionsReady)
  const ready = palacesReady && roomsReady && lociReady && questionsReady

  const loci = useMemo(() => lociForRoom(allLoci, roomId), [allLoci, roomId])
  const questions = useMemo(() => questionsForRoom(allQuestions, roomId), [allQuestions, roomId])

  const [now] = useState(() => Date.now())
  const overview = useMemo(() => studyOverview(loci, now), [loci, now])

  const prefs = usePreferencesStore(selectEffectivePreferences)
  const setContentSort = (value: ContentSort) =>
    void setPreferences(prefStore, { contentSort: value })

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectMode, setSelectMode] = useState(false)
  // The page's scroll container, so opening search can snap it back to the top — the
  // filtered list owns the screen and should never start mid-scroll from where you were.
  const scrollRef = useRef<HTMLElement | null>(null)
  const closeSearch = () => {
    setSearchOpen(false)
    setQuery('')
  }
  const openSearch = () => {
    setSelectMode(false)
    setSearchOpen(true)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
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
      <AppScreen
        header={
          <ScreenHeader
            title={t('roomHub.notFound')}
            onBack={onBack}
            backLabel={t('roomHub.back')}
          />
        }
      />
    )
  }

  const hasLoci = loci.length > 0

  return (
    <AppScreen
      scrollRef={(node) => {
        scrollRef.current = node
      }}
      header={
        searchOpen ? (
          <RoomSearchHeader
            value={query}
            onChange={setQuery}
            onClose={closeSearch}
            label={t('roomHub.searchLabel')}
            placeholder={t('roomHub.searchPlaceholder')}
            cancelLabel={t('common.cancel')}
          />
        ) : (
          <ScreenHeader
            title={room.title}
            subtitle={palace?.name}
            onBack={onBack}
            backLabel={t('roomHub.back')}
            action={
              <div className="flex items-center gap-0.5">
                {hasLoci && !selectMode ? (
                  <IconButton
                    variant="glass"
                    aria-label={t('roomHub.searchLabel')}
                    onClick={openSearch}
                  >
                    <Search className="size-5" aria-hidden />
                  </IconButton>
                ) : null}
                {onOpenSettings ? (
                  <IconButton
                    variant="glass"
                    aria-label={t('roomHub.settings')}
                    onClick={onOpenSettings}
                  >
                    <Settings2 className="size-5" aria-hidden />
                  </IconButton>
                ) : null}
              </div>
            }
          />
        )
      }
    >
      <div className="mt-2 space-y-4 pb-24">
        {/* While searching, the study chrome steps aside so the filtered list owns the screen.
            The deck is no longer previewed here — tapping any card opens the full browser. */}
        {!searchOpen && hasLoci ? (
          <StudyOverviewCard
            count={overview.count}
            breakdown={overview.breakdown}
            onStudy={() => onStudy?.()}
            onStudyAhead={onStudy}
            scope="room"
          />
        ) : null}

        {!searchOpen ? (
          <PracticeModes
            cardCount={loci.length}
            questionCount={questions.length}
            onVerse={onVerse}
            onMatch={onMatch}
            onTest={onTest}
            alwaysEnableTest
          />
        ) : null}

        <section aria-label={t('roomHub.manageHeading')} className="space-y-3 pt-1">
          <RoomContentEditor
            roomId={roomId}
            roomName={room.title}
            searchQuery={searchOpen ? query : ''}
            searching={searchOpen}
            onClearSearch={closeSearch}
            selectMode={selectMode}
            onSelectModeChange={setSelectMode}
            sort={prefs.contentSort}
            onSortChange={setContentSort}
            onAddCard={onAddCard}
            onEditCard={onEditCard}
          />
        </section>
      </div>
    </AppScreen>
  )
}

/** The room header's search takeover: a full-width field with a Cancel, filtering the room's
 * cards/questions below. Mirrors the home search pattern; same frosted header surface as
 * {@link ScreenHeader} so the swap reads as the same bar. */
function RoomSearchHeader({
  value,
  onChange,
  onClose,
  label,
  placeholder,
  cancelLabel,
}: {
  value: string
  onChange: (value: string) => void
  onClose: () => void
  label: string
  placeholder: string
  cancelLabel: string
}) {
  return (
    <header className="shrink-0 bg-glass px-5 pt-safe">
      <div className="flex min-h-14 items-center gap-2 pb-2 pt-3">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <TextField
            aria-label={label}
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoFocus
            enterKeyHint="search"
            className="pl-9"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 px-1 text-[length:var(--p-text-body)] font-semibold text-accent"
        >
          {cancelLabel}
        </button>
      </div>
    </header>
  )
}
