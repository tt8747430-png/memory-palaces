import { useTranslation } from 'react-i18next'
import { RotateCcw, Zap } from 'lucide-react'
import { Button, OutcomeOverlay } from '@/shared/ui'
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
  return (
    <OutcomeOverlay
      icon={<Zap className="size-12" aria-hidden />}
      title={t('quiz.complete')}
      tone={passed ? 'success' : 'info'}
    >
      <p className="text-(length:--p-text-sub) font-semibold text-heading">
        {t('quiz.scoreLine', { score: result.score, total: result.total })}
      </p>
      <p className="text-(length:--p-text-body) text-muted-foreground">
        {t('quiz.accuracy', { accuracy: result.accuracy })}
      </p>
      <div className="mt-4 flex gap-3">
        <Button variant="secondary" onClick={onRetry}>
          <RotateCcw className="size-5" aria-hidden />
          {t('quiz.retry')}
        </Button>
        <Button onClick={onDone}>{t('quiz.done')}</Button>
      </div>
    </OutcomeOverlay>
  )
}
