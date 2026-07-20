import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useServices } from '@/shell/services-provider'
import { useStore } from '@/shared/data/use-store'
import { cardsInSubtree, deckPath } from '@/shared/domain'
import { AppScreen, ScreenHeader } from '@/shared/ui'
import { useSessionReward } from '@/progress/ui'
import type { MatchCard } from '@/practice'
import { MatchBoard } from '@/practice/ui'

export interface MatchPageProps {
  deckId: string
  onBack?: () => void
}

/**
 * Stays a plain component with no ViewModel (ADR-0008): every rule it applies already lives in
 * a tested `shared/domain` function, so a hook here would be a Middle Man. Contrast `QuizPage`,
 * which owns a freeze rule and a shuffle-once rule that belong nowhere else.
 */
export function MatchPage({ deckId, onBack }: MatchPageProps) {
  const { t } = useTranslation()
  const { deckStore, cardStore } = useServices()
  const reward = useSessionReward()

  const decks = useStore(deckStore.decks)
  const allCards = useStore(cardStore.cards)
  const ready = useStore(cardStore.status) === 'ready'

  const deck = useMemo(() => decks.find((candidate) => candidate.id === deckId), [decks, deckId])

  const cards = useMemo<MatchCard[]>(
    () =>
      cardsInSubtree(decks, allCards, deckId).map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
      })),
    [decks, allCards, deckId],
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
      key={deckId}
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
