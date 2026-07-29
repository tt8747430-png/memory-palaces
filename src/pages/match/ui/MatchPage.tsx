import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { selectCards, useCardStore } from '@/entities/card'
import { selectDecks, useDeckStore } from '@/entities/deck'
import { cardsInSubtree, deckPath, findEntity, selectIsReady } from '@/shared/lib'
import { MatchBoard } from '@/widgets/match'
import { type MatchCard } from '@/features/match'
import { useSessionReward } from '@/widgets/session-reward'
import { MissingScreen, ScreenLoading } from '@/shared/ui'

export type MatchScope = { kind: 'deck'; deckId: string }

export interface MatchPageProps {
  scope: MatchScope
  onBack?: () => void
}

export function MatchPage({ scope, onBack }: MatchPageProps) {
  const { t } = useTranslation()
  const reward = useSessionReward()

  const decks = useDeckStore(selectDecks)
  const allCards = useCardStore(selectCards)
  const ready = useCardStore(selectIsReady)

  const deck = useMemo(() => findEntity(decks, scope.deckId), [decks, scope.deckId])

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
    return <ScreenLoading />
  }

  if (!deck) {
    return <MissingScreen title={t('match.notFound')} onBack={onBack} backLabel={t('match.back')} />
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
