import { useTranslation } from 'react-i18next'

export interface SelectModeBarProps {
  allSelected: boolean
  count: number
  onToggleAll: () => void
  onDone: () => void
}

export function SelectModeBar({ allSelected, count, onToggleAll, onDone }: SelectModeBarProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onToggleAll}
        className="-mx-2 -my-1 inline-flex min-h-11 items-center rounded-control px-2 text-[length:var(--ms-text-label)] font-semibold text-heading"
      >
        {allSelected ? t('cards.select.clearAll') : t('cards.select.selectAll')}
      </button>
      <span className="text-[length:var(--ms-text-label)] font-semibold text-muted-foreground">
        {t('cards.select.count', { count })}
      </span>
      <button
        type="button"
        onClick={onDone}
        className="-mx-2 -my-1 inline-flex min-h-11 items-center rounded-control px-2 text-[length:var(--ms-text-label)] font-semibold text-accent"
      >
        {t('cards.select.done')}
      </button>
    </div>
  )
}
