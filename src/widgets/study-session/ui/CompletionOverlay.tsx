import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Check, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/shared/ui'
import type { SessionSummary } from '../model/types'

export function CompletionOverlay({
  summary,
  onDone,
}: {
  summary: SessionSummary
  onDone: () => void
}) {
  const { t } = useTranslation()
  const total = summary.known + summary.learning

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-card-glass px-6 text-center"
    >
      <div className="mb-3 grid size-24 place-items-center rounded-full bg-(--success-surface)">
        <Check className="size-12 text-(--success-on-surface)" aria-hidden />
      </div>
      <h2 className="text-(length:--p-text-headline) font-bold text-heading">
        {t('study.complete')}
      </h2>
      <p className="inline-flex items-center gap-2 text-(length:--p-text-sub) font-semibold text-(--success-foreground)">
        <Sparkles className="size-4" aria-hidden />
        {t(summary.graded === 1 ? 'study.cardsReviewedOne' : 'study.cardsReviewedOther', {
          count: summary.graded,
        })}
      </p>
      {total > 0 && (
        <div className="mt-2 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-(--success-surface) px-3 py-1.5 text-(length:--p-text-label) font-semibold text-(--success-on-surface)">
            <Check className="size-4" aria-hidden />
            {summary.known} {t('study.known')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-(--warning-surface) px-3 py-1.5 text-(length:--p-text-label) font-semibold text-(--warning-foreground)">
            <RotateCcw className="size-4" aria-hidden />
            {summary.learning} {t('study.stillLearning')}
          </span>
        </div>
      )}
      <Button className="mt-6" onClick={onDone}>
        {t('study.done')}
      </Button>
    </motion.div>
  )
}
