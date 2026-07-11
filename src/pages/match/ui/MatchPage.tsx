import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  selectCards,
  selectIsReady as selectCardsReady,
  useCardStore,
  useCardStoreApi,
} from '@/entities/card'
import { selectDecks, useDeckStore, useDeckStoreApi } from '@/entities/deck'
import { cardsInSubtree, deckPath } from '@/shared/lib'
import { MatchBoard } from '@/widgets/match'
import { type MatchCard } from '@/features/match'
import { useSessionReward } from '@/widgets/session-reward'
import { AppScreen, ScreenHeader } from '@/shared/ui'

/** Match runs over a deck's whole subtree — its own cards plus every subdeck's (ADR-0003). */
export type MatchScope = { kind: 'deck'; deckId: string }

export interface MatchPageProps {
  scope: MatchScope
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

/** Match game over a deck subtree's cards — tap term/definition pairs to clear the board.
 * Read-only: it never grades or schedules, so no command is needed. */
export function MatchPage({ scope, onBack }: MatchPageProps) {
  const { t } = useTranslation()
  const cardStore = useCardStoreApi()
  const deckStore = useDeckStoreApi()
  const reward = useSessionReward()

  useEffect(() => {
    cardStore.getState().start()
    deckStore.getState().start()
  }, [cardStore, deckStore])

  const decks = useDeckStore(selectDecks)
  const allCards = useCardStore(selectCards)
  const ready = useCardStore(selectCardsReady)

  const deck = useMemo(
    () => decks.find((candidate) => candidate.id === scope.deckId),
    [decks, scope.deckId],
  )

  const cards = useMemo<MatchCard[]>(
    () =>
      cardsInSubtree(decks, allCards, scope.deckId).map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
      })),
    [decks, allCards, scope.deckId],
  )

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
          <ScreenHeader title={t('match.notFound')} onBack={onBack} backLabel={t('match.back')} />
        }
      />
    )
  }

  const subtitle = deckPath(decks, deck.id)
    .map((each) => each.name)
    .join(' · ')

  return (
    <MatchBoard
      key={scope.deckId}
      cards={cards}
      subtitle={subtitle}
      onBack={onBack ?? (() => {})}
      onComplete={() => {
        void reward({ kind: 'match', pairs: cards.length })
        onBack?.()
      }}
    />
  )
}
