import { useTranslation } from 'react-i18next'
import { LEARNING_ALGORITHMS, type LearningAlgorithm } from '@/entities/deck'
import { cn } from '@/shared/lib'
import { SelectDot, Sheet } from '@/shared/ui'
import { ALGORITHM_META } from './algorithm-meta'

export interface AlgorithmSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: LearningAlgorithm
  onChange: (value: LearningAlgorithm) => void
}

export function AlgorithmSheet({ open, onOpenChange, value, onChange }: AlgorithmSheetProps) {
  const { t } = useTranslation()

  const choose = (next: LearningAlgorithm) => {
    onChange(next)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('algorithm.chooseTitle')}>
      <div
        role="radiogroup"
        aria-label={t('algorithm.chooseTitle')}
        className="flex flex-col gap-3"
      >
        {LEARNING_ALGORITHMS.map((id) => {
          const meta = ALGORITHM_META[id]
          const selected = id === value
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(id)}
              className={cn(
                'rounded-card border border-border bg-card p-4 text-left',
                'transition-transform duration-150 ease-out active:scale-[0.99]',
                selected && 'border-accent ring-2 ring-accent/25',
              )}
            >
              <span className="flex items-center gap-3">
                {meta.icon}
                <span className="min-w-0 flex-1 text-(length:--p-text-body) font-semibold text-heading">
                  {t(meta.longNameKey as never)}
                </span>
                <SelectDot state={selected ? 'checked' : 'unchecked'} />
              </span>
              <span className="mt-2 block text-(length:--p-text-label) text-muted-foreground">
                {t(meta.bodyKey as never)}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-(length:--p-text-label) text-muted-foreground">
        {t('algorithm.keepsSchedules')}
      </p>
    </Sheet>
  )
}
