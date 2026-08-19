import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { useDeck, useDeckStoreApi } from '@/entities/deck'
import { selectCards, useCardStore } from '@/entities/card'
import { questionsForDeck, selectQuestions, useQuestionStore } from '@/entities/question'
import {
  type ContentSort,
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { updateDeckSettings } from '@/features/deck'
import { setPreferences } from '@/features/preferences'
import {
  cardsInSubtree,
  fastOverview,
  selectIsReady,
  studyOverview,
  useMultiSelect,
} from '@/shared/lib'
import { DeckContentEditor } from '@/widgets/content-editor'
import { AlgorithmLine } from './AlgorithmLine'
import { PracticeModes } from '@/widgets/practice-modes'
import {
  AppScreen,
  IconButton,
  ScreenHeader,
  ScreenLoading,
  SelectHeader,
  StudyOverviewCard,
} from '@/shared/ui'

export interface DeckDetailPageProps {
  deckId: string
  onBack?: () => void
  onOpenSettings?: () => void
  onStudy?: () => void
  onMatch?: () => void
  onTest?: () => void
  onAddCard: () => void
  onEditCard: (cardId: string) => void
  onPasteNotes: () => void
  onReviewImport: () => void
}

export function DeckDetailPage({
  deckId,
  onBack,
  onOpenSettings,
  onStudy,
  onMatch,
  onTest,
  onAddCard,
  onEditCard,
  onPasteNotes,
  onReviewImport,
}: DeckDetailPageProps) {
  const { t } = useTranslation()
  const prefStore = usePreferencesStoreApi()
  const deckStore = useDeckStoreApi()

  const { decks, deck, settings, ready: decksReady } = useDeck(deckId)
  const allCards = useCardStore(selectCards)
  const allQuestions = useQuestionStore(selectQuestions)
  const cardsReady = useCardStore(selectIsReady)
  const ready = decksReady && cardsReady

  const subtreeCards = useMemo(
    () => cardsInSubtree(decks, allCards, deckId),
    [decks, allCards, deckId],
  )
  const questions = useMemo(() => questionsForDeck(allQuestions, deckId), [allQuestions, deckId])

  const [now] = useState(() => Date.now())
  const fast = settings.algorithm === 'fast'

  /**
   * One card, two faces. The algorithm decides what the number means and what the three stats are
   * called; everything downstream just renders what it is handed.
   */
  const overview = useMemo(() => {
    if (fast) {
      const view = fastOverview(subtreeCards, settings.maxCardsPerDay)
      return {
        count: view.count,
        countLabel: t(
          view.count === 1 ? 'fastReview.cardsToStudy_one' : 'fastReview.cardsToStudy_other',
          { count: view.count },
        ),
        stats: [
          {
            key: 'notStudied',
            label: t('fastReview.notStudied'),
            value: view.breakdown.notStudied,
          },
          { key: 'notQuite', label: t('fastReview.notQuite'), value: view.breakdown.notQuite },
          { key: 'gotIt', label: t('fastReview.gotIt'), value: view.breakdown.gotIt },
        ],
      }
    }
    const view = studyOverview(subtreeCards, now)
    return {
      count: view.count,
      countLabel: t(view.count === 1 ? 'study.cardsForTodayOne' : 'study.cardsForTodayOther', {
        count: view.count,
      }),
      stats: [
        { key: 'new', label: t('srs.new'), value: view.breakdown.new },
        { key: 'learning', label: t('srs.learning'), value: view.breakdown.learning },
        { key: 'known', label: t('srs.known'), value: view.breakdown.known },
      ],
    }
  }, [fast, subtreeCards, settings.maxCardsPerDay, now, t])

  const prefs = usePreferencesStore(selectEffectivePreferences)
  const setContentSort = (value: ContentSort) =>
    void setPreferences(prefStore, { contentSort: value })
  const selection = useMultiSelect()

  if (!ready) {
    return <ScreenLoading />
  }

  if (!deck) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('deck.notFound')} onBack={onBack} backLabel={t('common.back')} />
        }
      />
    )
  }

  const hasContent = subtreeCards.length > 0

  return (
    <AppScreen
      header={
        selection.active ? (
          <SelectHeader selection={selection} />
        ) : (
          <ScreenHeader
            title={deck.name}
            onBack={onBack}
            backLabel={t('common.back')}
            action={
              onOpenSettings ? (
                <IconButton
                  variant="glass"
                  aria-label={t('deck.settings')}
                  onClick={onOpenSettings}
                >
                  <Settings className="size-5" aria-hidden />
                </IconButton>
              ) : null
            }
          />
        )
      }
    >
      <div className="mt-2 space-y-4 pb-24">
        {!selection.active ? (
          <AlgorithmLine
            value={settings.algorithm}
            onChange={(algorithm) => void updateDeckSettings(deckStore, deckId, { algorithm })}
          />
        ) : null}

        {hasContent && !selection.active ? (
          <StudyOverviewCard
            variant={settings.algorithm}
            count={overview.count}
            countLabel={overview.countLabel}
            stats={overview.stats}
            onStudy={() => onStudy?.()}
            onStudyAhead={fast ? undefined : onStudy}
          />
        ) : null}

        {(hasContent || questions.length > 0) && !selection.active ? (
          <PracticeModes
            cardCount={subtreeCards.length}
            questionCount={questions.length}
            onMatch={onMatch}
            onTest={onTest}
            alwaysEnableTest
          />
        ) : null}

        <section aria-label={t('deck.cards')} className="space-y-3 pt-1">
          <DeckContentEditor
            deckId={deckId}
            algorithm={settings.algorithm}
            selection={selection}
            sort={prefs.contentSort}
            onSortChange={setContentSort}
            onAddCard={onAddCard}
            onEditCard={onEditCard}
            onPasteNotes={onPasteNotes}
            onReviewImport={onReviewImport}
          />
        </section>
      </div>
    </AppScreen>
  )
}
