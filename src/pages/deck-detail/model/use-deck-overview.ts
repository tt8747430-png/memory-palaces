import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Card } from '@/entities/card'
import type { LearningAlgorithm } from '@/entities/deck'
import { fastOverview, studyOverview } from '@/shared/lib'
import type { OverviewStat } from '@/shared/ui'

export interface DeckOverview {
  count: number
  countLabel: string
  stats: OverviewStat[]
}

export function useDeckOverview(
  cards: readonly Card[],
  algorithm: LearningAlgorithm,
  maxCardsPerDay: number,
  now: number,
): DeckOverview {
  const { t } = useTranslation()

  return useMemo(() => {
    if (algorithm === 'fast') {
      const view = fastOverview(cards, maxCardsPerDay)
      return {
        count: view.count,
        countLabel: t(
          view.count === 1 ? 'fastReview.cardsToStudy_one' : 'fastReview.cardsToStudy_other',
          { count: view.count },
        ),
        stats: [
          { key: 'notStudied', label: t('srs.notStudied'), value: view.breakdown.notStudied },
          { key: 'notQuite', label: t('fastReview.notQuite'), value: view.breakdown.notQuite },
          { key: 'gotIt', label: t('fastReview.gotIt'), value: view.breakdown.gotIt },
        ],
      }
    }

    const view = studyOverview(cards, now)
    return {
      count: view.count,
      countLabel: t(view.count === 1 ? 'study.cardsForTodayOne' : 'study.cardsForTodayOther', {
        count: view.count,
      }),
      stats: [
        { key: 'new', label: t('srs.notStudied'), value: view.breakdown.new },
        { key: 'learning', label: t('srs.learning'), value: view.breakdown.learning },
        { key: 'known', label: t('srs.known'), value: view.breakdown.known },
      ],
    }
  }, [cards, algorithm, maxCardsPerDay, now, t])
}
