import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings2 } from 'lucide-react'
import {
  selectDecks,
  selectIsReady as selectDecksReady,
  useDeckStore,
  useDeckStoreApi,
} from '@/entities/deck'
import {
  selectCards,
  selectIsReady as selectCardsReady,
  useCardStore,
  useCardStoreApi,
} from '@/entities/card'
import {
  questionsForDeck,
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
import { cardsInSubtree, studyOverview } from '@/shared/lib'
import { DeckContentEditor } from '@/widgets/content-editor'
import { PracticeModes } from '@/widgets/practice-modes'
import { AppScreen, IconButton, ScreenHeader, StudyOverviewCard } from '@/shared/ui'

export interface DeckDetailPageProps {
  deckId: string
  onBack?: () => void
  onOpenSettings?: () => void
  onStudy?: () => void
  onMatch?: () => void
  onTest?: () => void
  onAddCard: () => void
  onEditCard: (cardId: string) => void
  /** Open the paste-notes page. */
  onPasteNotes: () => void
  /** Go to the shared import-review page (after a file has seeded the draft). */
  onReviewImport: () => void
}

/**
 * The one screen for a deck (route `/decks/:deckId`): a subtree study overview, the practice
 * rows, then **every card in the deck's subtree** in the full content editor (search, sort,
 * filter, select, import/export). Subdecks are navigated from the library tree's `+`
 * disclosure, not from this screen.
 */
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
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const questionStore = useQuestionStoreApi()
  const prefStore = usePreferencesStoreApi()

  useEffect(() => {
    deckStore.getState().start()
    cardStore.getState().start()
    questionStore.getState().start()
    prefStore.getState().start()
  }, [deckStore, cardStore, questionStore, prefStore])

  const decks = useDeckStore(selectDecks)
  const allCards = useCardStore(selectCards)
  const allQuestions = useQuestionStore(selectQuestions)
  const decksReady = useDeckStore(selectDecksReady)
  const cardsReady = useCardStore(selectCardsReady)
  const ready = decksReady && cardsReady

  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId])
  const subtreeCards = useMemo(
    () => cardsInSubtree(decks, allCards, deckId),
    [decks, allCards, deckId],
  )
  const questions = useMemo(() => questionsForDeck(allQuestions, deckId), [allQuestions, deckId])

  const [now] = useState(() => Date.now())
  const overview = useMemo(() => studyOverview(subtreeCards, now), [subtreeCards, now])

  const prefs = usePreferencesStore(selectEffectivePreferences)
  const setContentSort = (value: ContentSort) =>
    void setPreferences(prefStore, { contentSort: value })
  const [selectMode, setSelectMode] = useState(false)

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
          <ScreenHeader title={t('deck.notFound')} onBack={onBack} backLabel={t('common.back')} />
        }
      />
    )
  }

  const hasContent = subtreeCards.length > 0

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={deck.name}
          onBack={onBack}
          backLabel={t('common.back')}
          action={
            onOpenSettings ? (
              <IconButton variant="glass" aria-label={t('deck.settings')} onClick={onOpenSettings}>
                <Settings2 className="size-5" aria-hidden />
              </IconButton>
            ) : null
          }
        />
      }
    >
      <div className="mt-2 space-y-4 pb-24">
        {hasContent ? (
          <StudyOverviewCard
            count={overview.count}
            breakdown={overview.breakdown}
            onStudy={() => onStudy?.()}
            onStudyAhead={onStudy}
          />
        ) : null}

        {hasContent || questions.length > 0 ? (
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
            deckName={deck.name}
            selectMode={selectMode}
            onSelectModeChange={setSelectMode}
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
