import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers } from 'lucide-react'
import {
  type FastOutcome,
  type PriorAnswer,
  selectCards,
  useCardStore,
  useCardStoreApi,
} from '@/entities/card'
import { useDeck, useDeckStoreApi } from '@/entities/deck'
import {
  resolveStudyMode,
  selectEffectivePreferences,
  type StudyMode,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { cardsInSubtree, deckPath, findEntity, type Grade, selectIsReady } from '@/shared/lib'
import { type HistoryEntry, useHistoryStoreApi } from '@/entities/learning-history'
import { editCard } from '@/features/card'
import { updateDeckSettings } from '@/features/deck'
import { answerCard, type AnsweredCard, gradeCard, undoAnswer } from '@/features/review'
import { setPreferences } from '@/features/preferences'
import {
  type DeckStudyPrefs,
  FlashcardsPanel,
  type LearnerStudyPrefs,
  type StudyCard,
} from '@/widgets/study-session'
import { useStudySessionReward } from '@/widgets/study-session-reward'
import { Button, Empty, MissingScreen, ScreenLoading, StudySessionScreen } from '@/shared/ui'
import {
  deckStudyPrefs,
  deckStudyPrefsPatch,
  learnerStudyPrefs,
  learnerStudyPrefsPatch,
  lockedDeckPrefs,
} from '../model/study-prefs'

export type StudyScope = { kind: 'deck'; deckId: string }

export interface StudyCardsPageProps {
  scope: StudyScope
  onBack?: () => void
}

export function StudyCardsPage({ scope, onBack }: StudyCardsPageProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const preferencesStore = usePreferencesStoreApi()
  const historyStore = useHistoryStoreApi()
  const reward = useStudySessionReward()

  const { decks, deck, settings, ready: decksReady } = useDeck(scope.deckId)
  const allCards = useCardStore(selectCards)
  const preferences = usePreferencesStore(selectEffectivePreferences)
  const cardsReady = useCardStore(selectIsReady)
  const prefsReady = usePreferencesStore(selectIsReady)
  const ready = decksReady && cardsReady && prefsReady

  const mode: StudyMode = resolveStudyMode(preferences.studyMode)
  const learnerPrefs = useMemo(() => learnerStudyPrefs(preferences), [preferences])

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

  const answered = useRef(new Map<string, Promise<AnsweredCard>[]>())
  const remember = (id: string, write: Promise<AnsweredCard>) => {
    const stack = answered.current.get(id) ?? []
    stack.push(write)
    answered.current.set(id, stack)
  }

  const handleGrade = (id: string, grade: Grade) => {
    remember(id, gradeCard(cardStore, historyStore, id, grade))
  }
  const handleAnswer = (id: string, outcome: FastOutcome) => {
    remember(id, answerCard(cardStore, historyStore, id, outcome))
  }
  const handleUndo = (id: string, prior: PriorAnswer) => {
    const write = answered.current.get(id)?.pop()
    void (async () => {
      const entry: HistoryEntry | undefined = await write?.then(
        (result) => result.entry,
        () => undefined,
      )
      await undoAnswer(cardStore, historyStore, id, prior, entry?.id)
    })()
  }
  const handleToggleFlag = (id: string) => {
    const card = findEntity(cardStore.getState().cards, id)
    if (card) void editCard(cardStore, id, { flagged: !card.flagged })
  }
  const persistDeckPrefs = (prefs: DeckStudyPrefs) => {
    const patch = deckStudyPrefsPatch(deckStudyPrefs(settings), prefs)
    if (Object.keys(patch).length > 0) void updateDeckSettings(deckStore, scope.deckId, patch)
  }

  const persistLearnerPrefs = (changes: Partial<LearnerStudyPrefs>) =>
    void setPreferences(preferencesStore, learnerStudyPrefsPatch(changes))
  const changeMode = (next: StudyMode) => {
    void setPreferences(preferencesStore, { studyMode: next })
  }

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
    <StudySessionScreen>
      <FlashcardsPanel
        key={`flashcards-${scope.deckId}`}
        cards={cards}
        title={title}
        subtitle={subtitle}
        deckPrefs={deckStudyPrefs(settings)}
        lockedPrefs={lockedDeckPrefs(deck)}
        algorithm={settings.algorithm}
        mode={mode}
        learnerPrefs={learnerPrefs}
        onDeckPrefsChange={persistDeckPrefs}
        onLearnerPrefsChange={persistLearnerPrefs}
        onModeChange={changeMode}
        onGrade={handleGrade}
        onAnswer={handleAnswer}
        onRestoreCard={handleUndo}
        onToggleFlag={handleToggleFlag}
        onEditCard={(id, changes) => void editCard(cardStore, id, changes)}
        onBack={back}
        onComplete={(summary) => {
          void reward({ kind: 'study', graded: summary.graded })
          back()
        }}
      />
    </StudySessionScreen>
  )
}
