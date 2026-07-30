import { useMemo } from 'react'
import {
  type Achievement,
  type Badge,
  cardsInSubtree,
  computeAchievements,
  computeBadges,
  computeTrainingTotals,
  isDeckCompleted,
  nextMilestone,
  selectIsReady,
  totalTrainingDays,
  type TrainingTotals,
} from '@/shared/lib'
import { type Deck, selectDecks, useDeckStore } from '@/entities/deck'
import { selectCards, useCardStore } from '@/entities/card'
import { selectProgress, useProgressStore } from '@/entities/progress'

export interface Rewards {
  /** False while any of progress, decks or cards is still loading. */
  ready: boolean
  achievements: Achievement[]
  badges: Badge[]
  milestone: Badge | null
  totals: TrainingTotals
  topLevelDecks: Deck[]
  xp: number
  streakCount: number
  longestStreak: number
  bestQuizAccuracy: number
  daysTrained: number
}

/**
 * The single reading of what the learner has earned. Every screen that shows a
 * badge or an achievement takes it from here, so a change to how a milestone is
 * counted lands on the profile, the grids and the detail screens together.
 */
export function useRewards(): Rewards {
  const progress = useProgressStore(selectProgress)
  const decks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const progressReady = useProgressStore(selectIsReady)
  const decksReady = useDeckStore(selectIsReady)
  const cardsReady = useCardStore(selectIsReady)

  const xp = progress?.xp ?? 0
  const streakCount = progress?.streakCount ?? 0
  const longestStreak = progress?.longestStreak ?? 0
  const bestQuizAccuracy = progress?.bestQuizAccuracy ?? 0
  const trainingDays = progress?.trainingDays

  const totals = useMemo(() => computeTrainingTotals(decks, cards), [decks, cards])
  const daysTrained = useMemo(() => totalTrainingDays(trainingDays ?? []), [trainingDays])
  const topLevelDecks = useMemo(() => decks.filter((deck) => deck.parentId === null), [decks])
  const anyDeckCompleted = useMemo(
    () => topLevelDecks.some((deck) => isDeckCompleted(cardsInSubtree(decks, cards, deck.id))),
    [topLevelDecks, decks, cards],
  )

  const badges = useMemo(
    () =>
      computeBadges({
        xp,
        longestStreak,
        decksCompleted: totals.decksCompleted,
        deckCount: topLevelDecks.length,
        totalCards: totals.totalCards,
        trainingDayCount: daysTrained,
      }),
    [xp, longestStreak, totals, topLevelDecks.length, daysTrained],
  )

  const achievements = useMemo(
    () =>
      computeAchievements({
        deckCount: topLevelDecks.length,
        streakCount,
        xp,
        bestQuizAccuracy,
        decksCompleted: totals.decksCompleted,
        anyDeckCompleted,
      }),
    [
      topLevelDecks.length,
      streakCount,
      xp,
      bestQuizAccuracy,
      totals.decksCompleted,
      anyDeckCompleted,
    ],
  )

  const milestone = useMemo(() => nextMilestone(badges), [badges])

  return {
    ready: progressReady && decksReady && cardsReady,
    achievements,
    badges,
    milestone,
    totals,
    topLevelDecks,
    xp,
    streakCount,
    longestStreak,
    bestQuizAccuracy,
    daysTrained,
  }
}
