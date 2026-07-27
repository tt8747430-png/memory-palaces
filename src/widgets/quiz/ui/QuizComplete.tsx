import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { RotateCcw, Zap } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui'
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-card-glass px-6 text-center"
    >
      <div
        className={cn(
          'mb-3 grid size-24 place-items-center rounded-full',
          passed ? 'bg-(--success-surface)' : 'bg-info-surface',
        )}
      >
        <Zap
          className={cn('size-12', passed ? 'text-(--success-on-surface)' : 'text-accent')}
          aria-hidden
        />
      </div>
      <h2 className="text-(length:--p-text-headline) font-bold text-heading">
        {t('quiz.complete')}
      </h2>
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
    </motion.div>
  )
}
