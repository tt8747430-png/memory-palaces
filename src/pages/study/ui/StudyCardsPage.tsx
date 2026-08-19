import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Layers } from 'lucide-react'
import { type FastOutcome, selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { type Deck, type DeckSettings, useDeck, useDeckStoreApi } from '@/entities/deck'
import {
  type FlashcardSwipeByMode,
  resolveStudyMode,
  selectEffectivePreferences,
  type StudyMode,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { cardsInSubtree, deckPath, findEntity, selectIsReady } from '@/shared/lib'
import { normalizeFlashcardSwipe } from '@/shared/config/flashcard-swipe'
import { editCard, setCardFastReview } from '@/features/card'
import { editDeck } from '@/features/deck'
import { gradeCard, restoreSchedule } from '@/features/review'
import { setPreferences } from '@/features/preferences'
import { FlashcardsPanel, type StudyCard, type StudyPrefs } from '@/widgets/study-session'
import { useSessionReward } from '@/widgets/session-reward'
import {
  Button,
  Empty,
  MissingScreen,
  ScreenLoading,
  SessionHeader,
  SessionScreen,
} from '@/shared/ui'

export type StudyScope = { kind: 'deck'; deckId: string }

export interface StudyCardsPageProps {
  scope: StudyScope
  onBack?: () => void
}

function studyPrefsFromSettings(settings: DeckSettings): StudyPrefs {
  return {
    direction: settings.studyDirection,
    shuffle: settings.shuffleCards,
    textToSpeech: settings.textToSpeech,
    newCardsPerDay: settings.newCardsPerDay,
    maxCardsPerDay: settings.maxCardsPerDay,
    cardStyle: settings.cardStyle,
  }
}

export function StudyCardsPage({ scope, onBack }: StudyCardsPageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const preferencesStore = usePreferencesStoreApi()
  const reward = useSessionReward()
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  const { decks, deck, settings, ready: decksReady } = useDeck(scope.deckId)
  const allCards = useCardStore(selectCards)
  const preferences = usePreferencesStore(selectEffectivePreferences)
  const cardsReady = useCardStore(selectIsReady)
  const prefsReady = usePreferencesStore(selectIsReady)
  const ready = decksReady && cardsReady && prefsReady

  const mode: StudyMode = resolveStudyMode(preferences.studyMode)
  const swipeByMode = useMemo(
    () => normalizeFlashcardSwipe(preferences.flashcardSwipe),
    [preferences.flashcardSwipe],
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
  const handleAnswer = (id: string, outcome: FastOutcome) => {
    void setCardFastReview(cardStore, id, outcome)
  }
  const handleToggleFlag = (id: string) => {
    const card = findEntity(cardStore.getState().cards, id)
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
    return <ScreenLoading />
  }

  if (!deck) {
    return <MissingScreen title={t('study.notFound')} onBack={onBack} backLabel={t('study.back')} />
  }

  const title = deck.name
  const subtitle = deckPath(decks, deck.id)
    .slice(0, -1)
    .map((each) => each.name)
    .join(' › ')
  const back = onBack ?? (() => {})

  if (cards.length === 0) {
    return (
      <Empty
        variant="hero"
        className="mx-auto h-full w-full max-w-app"
        icon={<Layers className="size-8" aria-hidden />}
        title={t('study.noCards')}
        description={t('study.noCardsHint', { deck: title })}
        action={<Button onClick={back}>{t('study.backToDeck')}</Button>}
      />
    )
  }

  return (
    <SessionScreen>
      <SessionHeader
        title={title}
        subtitle={subtitle}
        progress={progress}
        backLabel={t('study.goBack')}
        onBack={back}
        backIcon={<ChevronLeft className="size-5" aria-hidden />}
      />

      <FlashcardsPanel
        key={`flashcards-${scope.deckId}`}
        cards={cards}
        prefs={studyPrefsFromSettings(settings)}
        algorithm={settings.algorithm}
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
        onAnswer={handleAnswer}
        onProgress={(done, total) => setProgress({ done, total })}
        onRestoreCard={(id, srs) => void restoreSchedule(cardStore, id, srs)}
        onToggleFlag={handleToggleFlag}
        onEditCard={(id, changes) => void editCard(cardStore, id, changes)}
        onBack={back}
        onComplete={(summary) => {
          void reward({ kind: 'study', graded: summary.graded })
          back()
        }}
      />
    </SessionScreen>
  )
}
