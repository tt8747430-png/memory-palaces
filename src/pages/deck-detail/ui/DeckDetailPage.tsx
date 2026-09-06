import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Settings } from 'lucide-react'
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
import { cardsInSubtree, selectIsReady, useMultiSelect } from '@/shared/lib'
import { DeckContentEditor } from '@/widgets/content-editor'
import { useDeckOverview } from '../model/use-deck-overview'
import { AlgorithmLine } from './AlgorithmLine'
import { PracticeModes } from '@/widgets/practice-modes'
import {
  AppScreen,
  IconButton,
  ScreenHeader,
  ScreenLoading,
  SearchField,
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

  const overview = useDeckOverview(subtreeCards, settings.algorithm, settings.maxCardsPerDay, now)

  const prefs = usePreferencesStore(selectEffectivePreferences)
  const setContentSort = (value: ContentSort) =>
    void setPreferences(prefStore, { contentSort: value })
  const selection = useMultiSelect()

  // Search is a mode, not a permanent field: a deck of six cards does not want a search box over
  // it, and the band costs the list its height while it is open. `DeckContentEditor` has taken
  // `searchQuery` / `searching` / `onClearSearch` since it was written — nothing ever passed them,
  // so its filter, its `NoResults` state and both `!searching` gates were unreachable.
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const closeSearch = () => {
    setSearching(false)
    setQuery('')
  }

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
      gutter="dial"
      header={
        selection.active ? (
          <SelectHeader selection={selection} />
        ) : (
          <ScreenHeader
            title={deck.name}
            onBack={onBack}
            backLabel={t('common.back')}
            action={
              <span className="flex items-center gap-1">
                {hasContent ? (
                  <IconButton
                    variant="glass"
                    aria-label={t('cards.searchCards')}
                    aria-expanded={searching}
                    onClick={() => (searching ? closeSearch() : setSearching(true))}
                  >
                    <Search className="size-5" aria-hidden />
                  </IconButton>
                ) : null}
                {onOpenSettings ? (
                  <IconButton
                    variant="glass"
                    aria-label={t('deck.settings')}
                    onClick={onOpenSettings}
                  >
                    <Settings className="size-5" aria-hidden />
                  </IconButton>
                ) : null}
              </span>
            }
          />
        )
      }
      pinned={
        searching && !selection.active ? (
          <div className="px-5 pb-3">
            <SearchField
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder={t('cards.searchCards')}
              closeLabel={t('cards.closeSearch')}
              onClose={closeSearch}
            />
          </div>
        ) : null
      }
    >
      <div className="mt-2 space-y-4">
        {!selection.active && !searching ? (
          <AlgorithmLine
            value={settings.algorithm}
            onChange={(algorithm) => void updateDeckSettings(deckStore, deckId, { algorithm })}
          />
        ) : null}

        {hasContent && !selection.active && !searching ? (
          <StudyOverviewCard
            variant={settings.algorithm}
            count={overview.count}
            countLabel={overview.countLabel}
            stats={overview.stats}
            onStudy={() => onStudy?.()}
            onStudyAhead={fast ? undefined : onStudy}
          />
        ) : null}

        {(hasContent || questions.length > 0) && !selection.active && !searching ? (
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
            searchQuery={query}
            searching={searching}
            onClearSearch={closeSearch}
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
