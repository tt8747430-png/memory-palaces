import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import { HeaderBar } from './HeaderBar'

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
 * the two labels change width ("Select all" ⇄ "Clear all"). It rides the same `HeaderBar` as
 * `ScreenHeader`, so entering a selection swaps the contents of the bar without resizing it —
 * the list underneath never moves. Its labels sit at the content margin instead of the bar's
 * icon-button margin, so they line up with the rows they act on.
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
    <HeaderBar className={cn('grid grid-cols-[1fr_auto_1fr] gap-2 px-5', className)}>
      <button type="button" onClick={onToggleAll} className={cn(ACTION, 'justify-self-start')}>
        {allSelected ? t('selection.clearAll') : t('selection.selectAll')}
      </button>
      <span className="text-(length:--p-text-body) font-semibold tabular-nums text-heading">
        {t('selection.count', { count })}
      </span>
      <button type="button" onClick={onCancel} className={cn(ACTION, 'justify-self-end')}>
        {t('common.cancel')}
      </button>
    </HeaderBar>
  )
}
