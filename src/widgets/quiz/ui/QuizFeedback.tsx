import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Flame, XCircle } from 'lucide-react'
import { cn } from '@/shared/lib'

export interface QuizFeedbackProps {
  correct: boolean
  explanation?: string
  streak: number
}

export function QuizFeedback({ correct, explanation, streak }: QuizFeedbackProps) {
  const { t } = useTranslation()
  const tone = correct ? 'text-(--success-on-surface)' : 'text-(--danger-on-surface)'
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        'rounded-card border p-4',
        correct
          ? 'border-(--success)/30 bg-(--success-surface)'
          : 'border-(--danger)/30 bg-(--danger-surface)',
      )}
    >
      <div className="flex items-start gap-2.5">
        {correct ? (
          <CheckCircle2 className={cn('mt-0.5 size-5 shrink-0', tone)} aria-hidden />
        ) : (
          <XCircle className={cn('mt-0.5 size-5 shrink-0', tone)} aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('font-semibold', tone)}>
              {correct ? t('quiz.correct') : t('quiz.notQuite')}
            </p>
            {correct && streak >= 2 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-(--warning-surface) px-2 py-0.5 text-(length:--p-text-label) font-semibold text-(--warning-foreground)">
                <Flame className="size-3" aria-hidden />
                {t('quiz.streakOther', { count: streak })}
              </span>
            ) : null}
          </div>
          <p className={cn('mt-1 text-(length:--p-text-label)', tone)}>
            {explanation ?? (correct ? t('quiz.wellRecalled') : t('quiz.reviewHint'))}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
