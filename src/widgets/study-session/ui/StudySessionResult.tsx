import { useTranslation } from 'react-i18next'
import { Check, RotateCcw, Sparkles } from 'lucide-react'
import { ResultScreen, type ResultStat } from '@/shared/ui'
import type { SessionSummary } from '../model/types'

export interface StudySessionResultProps {
  summary: SessionSummary
  onDone: () => void
}

/** What a flashcards study session ends on: how many were graded, and where they landed. */
export function StudySessionResult({ summary, onDone }: StudySessionResultProps) {
  const { t } = useTranslation()
  const { graded, known, learning } = summary

  // Tiles only once a card was graded; a study session that graded nothing would otherwise report
  // three zeroes as though they were a result.
  const stats: ResultStat[] =
    graded > 0
      ? [
          {
            id: 'graded',
            icon: <Sparkles aria-hidden />,
            value: String(graded),
            label: t('study.reviewed'),
          },
          {
            id: 'known',
            icon: <Check aria-hidden />,
            value: String(known),
            label: t('study.known'),
          },
          {
            id: 'learning',
            icon: <RotateCcw aria-hidden />,
            value: String(learning),
            label: t('study.stillLearning'),
          },
        ]
      : []

  return (
    <ResultScreen
      icon={<Check className="size-12" aria-hidden />}
      title={t('study.complete')}
      message={t(graded === 1 ? 'study.cardsReviewedOne' : 'study.cardsReviewedOther', {
        count: graded,
      })}
      stats={stats}
      action={{ label: t('study.done'), onClick: onDone }}
    />
  )
}
