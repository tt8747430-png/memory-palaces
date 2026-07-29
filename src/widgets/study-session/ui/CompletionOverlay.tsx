import { useTranslation } from 'react-i18next'
import { Check, RotateCcw, Sparkles } from 'lucide-react'
import { Button, OutcomeOverlay } from '@/shared/ui'
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
    <OutcomeOverlay icon={<Check className="size-12" aria-hidden />} title={t('study.complete')}>
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
    </OutcomeOverlay>
  )
}
