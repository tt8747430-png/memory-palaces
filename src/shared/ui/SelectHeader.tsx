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
