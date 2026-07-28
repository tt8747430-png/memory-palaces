import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { selectDecks, useDeckStore } from '@/entities/deck'
import { selectCards, useCardStore } from '@/entities/card'
import { questionsForDeck, selectQuestions, useQuestionStore } from '@/entities/question'
import {
  type ContentSort,
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'
import { cardsInSubtree, selectIsReady, studyOverview, useMultiSelect } from '@/shared/lib'
import { DeckContentEditor } from '@/widgets/content-editor'
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

  const decks = useDeckStore(selectDecks)
  const allCards = useCardStore(selectCards)
  const allQuestions = useQuestionStore(selectQuestions)
  const decksReady = useDeckStore(selectIsReady)
  const cardsReady = useCardStore(selectIsReady)
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
          <SelectHeader
            count={selection.count}
            allSelected={selection.allSelected}
            onToggleAll={selection.toggleAll}
            onCancel={selection.exit}
          />
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
        {hasContent && !selection.active ? (
          <StudyOverviewCard
            count={overview.count}
            breakdown={overview.breakdown}
            onStudy={() => onStudy?.()}
            onStudyAhead={onStudy}
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
