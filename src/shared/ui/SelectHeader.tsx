import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'

export interface SelectHeaderProps {
  count: number
  allSelected: boolean
  onToggleAll: () => void
  onCancel: () => void
  className?: string
}

const ACTION =
  '-mx-2 inline-flex min-h-11 items-center rounded-control px-2 text-(length:--p-text-body) font-semibold text-accent transition-transform active:scale-[0.97]'

/**
 * The screen header a multi-selection replaces the normal one with, on every surface that can
 * select: select-all on the left, the running count in the middle, cancel on the right. It is
 * the *only* place a selection reports itself — a list must not print its own count underneath.
 *
 * A three-column grid rather than `justify-between`, so the count stays optically centred while
 * the two labels change width ("Select all" ⇄ "Clear all").
 */
export function SelectHeader({
  count,
  allSelected,
  onToggleAll,
  onCancel,
  className,
}: SelectHeaderProps) {
  const { t } = useTranslation()
  return (
    <header className={cn('shrink-0 bg-glass px-4 pt-safe', className)}>
      <div className="grid min-h-14 grid-cols-[1fr_auto_1fr] items-center gap-2 pt-3 pb-2">
        <button type="button" onClick={onToggleAll} className={cn(ACTION, 'justify-self-start')}>
          {allSelected ? t('selection.clearAll') : t('selection.selectAll')}
        </button>
        <span className="text-(length:--p-text-body) font-semibold tabular-nums text-heading">
          {t('selection.count', { count })}
        </span>
        <button type="button" onClick={onCancel} className={cn(ACTION, 'justify-self-end')}>
          {t('common.cancel')}
        </button>
      </div>
    </header>
  )
}
