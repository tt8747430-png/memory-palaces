import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Layers } from 'lucide-react'
import {
  selectCards,
  selectIsReady as selectCardsReady,
  useCardStore,
  useCardStoreApi,
} from '@/entities/card'
import {
  type Deck,
  type DeckSettings,
  DEFAULT_DECK_SETTINGS,
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import {
  type FlashcardSwipeByMode,
  resolveStudyMode,
  selectEffectivePreferences,
  selectIsReady as selectPrefsReady,
  type StudyMode,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { cardsInSubtree, deckPath, resolveDeckSettings } from '@/shared/lib'
import { normalizeFlashcardSwipe } from '@/shared/config/flashcard-swipe'
import { editCard } from '@/features/card'
import { editDeck } from '@/features/deck'
import { gradeCard, restoreSchedule } from '@/features/review'
import { setPreferences } from '@/features/preferences'
import { type StudyCard, type StudyPrefs, FlashcardsPanel } from '@/widgets/study-session'
import { useSessionReward } from '@/widgets/session-reward'
import { AppScreen, Button, IconButton, ScreenHeader } from '@/shared/ui'

/** Study a deck's whole subtree: its own cards plus every descendant subdeck's (ADR-0003). */
export type StudyScope = { kind: 'deck'; deckId: string }

export interface StudyCardsPageProps {
  scope: StudyScope
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

function studyPrefsFromSettings(settings: DeckSettings): StudyPrefs {
  return {
    direction: settings.studyDirection,
    shuffle: settings.shuffleCards,
    textToSpeech: settings.textToSpeech,
  }
}

/** The one study surface: a deck subtree's cards worked as a single spaced-review session.
 * Opens in the last-used mode (persisted globally); every mode grades through `gradeCard`, so
 * SRS schedules survive offline. Orientation/shuffle/speech seed from and persist to the deck's
 * resolved settings; mode and shake-to-undo are recorded to global preferences. */
export function StudyCardsPage({ scope, onBack }: StudyCardsPageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const preferencesStore = usePreferencesStoreApi()
  const reward = useSessionReward()

  useEffect(() => {
    deckStore.getState().start()
    cardStore.getState().start()
    preferencesStore.getState().start()
  }, [deckStore, cardStore, preferencesStore])

  const decks = useDeckStore(selectDecks)
  const allCards = useCardStore(selectCards)
  const preferences = usePreferencesStore(selectEffectivePreferences)
  const decksReady = useDeckStore(selectDecksReady)
  const cardsReady = useCardStore(selectCardsReady)
  const prefsReady = usePreferencesStore(selectPrefsReady)
  const ready = decksReady && cardsReady && prefsReady

  const mode: StudyMode = resolveStudyMode(preferences.studyMode)
  const swipeByMode = useMemo(
    () => normalizeFlashcardSwipe(preferences.flashcardSwipe),
    [preferences.flashcardSwipe],
  )

  const deck = useMemo(
    () => decks.find((candidate) => candidate.id === scope.deckId),
    [decks, scope.deckId],
  )

  const settings = useMemo(
    () => resolveDeckSettings(decks, scope.deckId, DEFAULT_DECK_SETTINGS),
    [decks, scope.deckId],
  )

  const cards = useMemo<StudyCard[]>(() => {
    if (!deck) return []
    const subtree = cardsInSubtree(decks, allCards, scope.deckId)
    return subtree.map((card) => ({
      card,
      deckName: deck.name,
      deckPath: deckPath(decks, card.deckId)
        .map((each) => each.name)
        .join(' › '),
    }))
  }, [deck, decks, allCards, scope.deckId])

  const handleGrade = (id: string, grade: Parameters<typeof gradeCard>[2]) => {
    void gradeCard(cardStore, id, grade)
  }
  const handleToggleFlag = (id: string) => {
    const card = cardStore.getState().cards.find((candidate) => candidate.id === id)
    if (card) void editCard(cardStore, id, { flagged: !card.flagged })
  }
  const persistStudyPrefs = (target: Deck) => (prefs: StudyPrefs) => {
    void editDeck(deckStore, target.id, {
      settings: {
        ...target.settings,
        studyDirection: prefs.direction,
        shuffleCards: prefs.shuffle,
        textToSpeech: prefs.textToSpeech,
      },
    })
  }
  const persistSwipe = (config: FlashcardSwipeByMode) =>
    void setPreferences(preferencesStore, { flashcardSwipe: config })
  const changeMode = (next: StudyMode) => {
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

  if (!deck) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('study.notFound')} onBack={onBack} backLabel={t('study.back')} />
        }
      />
    )
  }

  const title = deck.name
  const subtitle = deckPath(decks, deck.id)
    .slice(0, -1)
    .map((each) => each.name)
    .join(' › ')
  const back = onBack ?? (() => {})

  // A deck with no authored cards anywhere in its subtree: a real empty state.
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
            {t('study.noCardsHint', { deck: title })}
          </p>
        </div>
        <Button onClick={back}>{t('study.backToDeck')}</Button>
      </div>
    )
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden">
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
          <div className="size-10 shrink-0" aria-hidden />
        </div>
      </div>

      <FlashcardsPanel
        key={`flashcards-${scope.deckId}`}
        cards={cards}
        prefs={studyPrefsFromSettings(settings)}
        mode={mode}
        wordSpaces={preferences.studyWordSpaces}
        shakeToUndo={preferences.shakeToUndo}
        swipeByMode={swipeByMode}
        onPrefsChange={persistStudyPrefs(deck)}
        onSwipeByModeChange={persistSwipe}
        onModeChange={changeMode}
        onWordSpacesChange={persistWordSpaces}
        onShakeToUndoChange={(value) =>
          void setPreferences(preferencesStore, { shakeToUndo: value })
        }
        onGrade={handleGrade}
        onRestoreCard={(id, srs) => void restoreSchedule(cardStore, id, srs)}
        onToggleFlag={handleToggleFlag}
        onEditCard={(id, changes) => void editCard(cardStore, id, changes)}
        onBack={back}
        onComplete={(summary) => {
          void reward({ kind: 'study', graded: summary.graded })
          back()
        }}
      />
    </div>
  )
}
