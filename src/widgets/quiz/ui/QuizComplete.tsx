import { useTranslation } from 'react-i18next'
import { Check, RotateCcw, Target, Zap } from 'lucide-react'
import { ResultScreen, type ResultStat } from '@/shared/ui'
import type { QuizResult } from '../model/types'

const PASS_MARK = 80

export interface QuizCompleteProps {
  result: QuizResult
  onRetry: () => void
  onDone: () => void
}

export function QuizComplete({ result, onRetry, onDone }: QuizCompleteProps) {
  const { t } = useTranslation()
  const passed = result.accuracy >= PASS_MARK

  const stats: ResultStat[] = [
    {
      id: 'score',
      icon: <Check aria-hidden />,
      value: String(result.score),
      label: t('quiz.correct'),
    },
    {
      id: 'total',
      icon: <Zap aria-hidden />,
      value: String(result.total),
      label: t('quiz.questions'),
    },
    {
      id: 'accuracy',
      icon: <Target aria-hidden />,
      value: `${result.accuracy}%`,
      label: t('quiz.accuracyLabel'),
    },
  ]

  return (
    <ResultScreen
      icon={
        passed ? <Check className="size-12" aria-hidden /> : <Zap className="size-12" aria-hidden />
      }
      title={t('quiz.complete')}
      message={t('quiz.scoreLine', { score: result.score, total: result.total })}
      stats={stats}
      action={{ label: t('quiz.done'), onClick: onDone }}
      secondaryAction={{
        label: t('quiz.retry'),
        onClick: onRetry,
        icon: <RotateCcw aria-hidden />,
      }}
    />
  )
}
