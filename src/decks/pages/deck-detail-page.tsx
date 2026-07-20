import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { questionsForDeck } from '@/decks'
import { DeckContentEditor, StudyOverviewCard } from '@/decks/ui'
import { PracticeModes } from '@/practice/ui'
import { type ContentSort, setPreferences } from '@/settings'
import { cardsInSubtree, studyOverview } from '@/shared/domain'
import { AppScreen, IconButton, ScreenHeader } from '@/shared/ui'
import { useStore } from '@/shared/data/use-store'
import { useServices } from '@/shell/services-provider'

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

/**
 * The deck hub: study overview, practice modes, and the card content editor. Plain component by
 * design (A.7) — the derived read models are three `useMemo`s over already-tested domain
 * functions, and the only orchestration (`setContentSort`) is a one-line command dispatch. There
 * is no ViewModel to earn.
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
  const { deckStore, cardStore, questionStore, preferencesStore } = useServices()

  const decks = useStore(deckStore.decks)
  const allCards = useStore(cardStore.cards)
  const allQuestions = useStore(questionStore.questions)
  const decksReady = useStore(deckStore.status) === 'ready'
  const cardsReady = useStore(cardStore.status) === 'ready'
  const ready = decksReady && cardsReady

  const deck = useMemo(() => decks.find((d) => d.id === deckId), [decks, deckId])
  const subtreeCards = useMemo(
    () => cardsInSubtree(decks, allCards, deckId),
    [decks, allCards, deckId],
  )
  const questions = useMemo(() => questionsForDeck(allQuestions, deckId), [allQuestions, deckId])

  // Pinned once per mount: a ticking clock would re-bucket the overview mid-read.
  const [now] = useState(() => Date.now())
  const overview = useMemo(() => studyOverview(subtreeCards, now), [subtreeCards, now])

  const prefs = useStore(preferencesStore.effective)
  const setContentSort = (value: ContentSort) =>
    void setPreferences(preferencesStore, { contentSort: value })
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
                <Settings className="size-5" aria-hidden />
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
