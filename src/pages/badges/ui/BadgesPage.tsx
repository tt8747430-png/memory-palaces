import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type BadgeId,
  computeBadges,
  computeTrainingTotals,
  nextMilestone,
  totalTrainingDays,
} from '@/shared/lib'
import {
  selectIsReady as selectProgressReady,
  selectProgress,
  useProgressStore,
  useProgressStoreApi,
} from '@/entities/progress'
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
import { BadgeGrid, NextMilestoneCard } from '@/widgets/badge-list'
import { AppScreen, ScreenHeader } from '@/shared/ui'

export interface BadgesPageProps {
  onBack?: () => void
  onOpenBadge?: (id: BadgeId) => void
}

export function BadgesPage({ onBack, onOpenBadge }: BadgesPageProps = {}) {
  const { t } = useTranslation()
  const progressStore = useProgressStoreApi()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const progress = useProgressStore(selectProgress)
  const decks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const progressReady = useProgressStore(selectProgressReady)
  const decksReady = useDeckStore(selectDecksReady)
  const cardsReady = useCardStore(selectCardsReady)
  const dataReady = progressReady && decksReady && cardsReady

  useEffect(() => {
    progressStore.getState().start()
    deckStore.getState().start()
    cardStore.getState().start()
  }, [progressStore, deckStore, cardStore])

  const totals = useMemo(() => computeTrainingTotals(decks, cards), [decks, cards])
  const topLevelDecks = useMemo(() => decks.filter((deck) => deck.parentId === null), [decks])
  const badges = useMemo(
    () =>
      computeBadges({
        xp: progress?.xp ?? 0,
        longestStreak: progress?.longestStreak ?? 0,
        decksCompleted: totals.decksCompleted,
        deckCount: topLevelDecks.length,
        totalCards: totals.totalCards,
        trainingDayCount: totalTrainingDays(progress?.trainingDays ?? []),
      }),
    [progress, totals, topLevelDecks.length],
  )
  const milestone = useMemo(() => nextMilestone(badges), [badges])

  return (
    <AppScreen
      fill
      className="pb-28"
      header={
        <ScreenHeader title={t('badges.title')} onBack={onBack} backLabel={t('common.back')} />
      }
    >
      {!dataReady ? (
        <BadgesSkeleton />
      ) : (
        <div className="mt-2 flex flex-col gap-5">
          <p className="px-1 text-[length:var(--p-text-label)] text-muted-foreground">
            {t('badges.explainer')}
          </p>
          {milestone ? (
            <NextMilestoneCard badge={milestone} onOpen={() => onOpenBadge?.(milestone.id)} />
          ) : null}
          <BadgeGrid badges={badges} onOpenBadge={onOpenBadge} />
        </div>
      )}
    </AppScreen>
  )
}

function BadgesSkeleton() {
  return (
    <div aria-hidden className="mt-2 flex flex-col gap-5">
      <div className="h-3 w-44 animate-pulse rounded-full bg-secondary/30" />
      <div className="h-20 animate-pulse rounded-card bg-secondary/30" />
      <div className="grid grid-cols-3 gap-x-3 gap-y-7">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div className="size-20 animate-pulse rounded-full bg-secondary/30" />
            <div className="h-2.5 w-12 animate-pulse rounded-full bg-secondary/20" />
          </div>
        ))}
      </div>
    </div>
  )
}
