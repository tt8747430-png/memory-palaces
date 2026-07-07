import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'

/** The select-mode header shared by the cards and questions lists: toggle-all on the left,
 * the live count in the middle, Done on the right. Text buttons carry an invisible 44px
 * hit area (negative margins) so the visual stays a quiet toolbar. */
export function SelectModeBar({
  allSelected,
  count,
  onToggleAll,
  onDone,
}: {
  allSelected: boolean
  count: number
  onToggleAll: () => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onToggleAll}
        className="-mx-2 -my-1 inline-flex min-h-11 items-center rounded-control px-2 text-(length:--p-text-label) font-semibold text-heading"
      >
        {allSelected ? t('loci.select.clearAll') : t('loci.select.selectAll')}
      </button>
      <span className="text-(length:--p-text-label) font-semibold text-muted-foreground">
        {t('loci.select.count', { count })}
      </span>
      <button
        type="button"
        onClick={onDone}
        className="-mx-2 -my-1 inline-flex min-h-11 items-center rounded-control px-2 text-(length:--p-text-label) font-semibold text-accent"
      >
        {t('loci.select.done')}
      </button>
    </div>
  )
}

/** One action in the floating bulk tray beneath a selection, shared by the cards and
 * questions lists — info tint by default, danger surface for delete. */
export function BulkButton({
  icon,
  label,
  onClick,
  disabled,
  tone = 'default',
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-control text-(length:--p-text-label) font-semibold',
        'transition-transform active:scale-[0.97] disabled:opacity-40',
        tone === 'danger'
          ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]'
          : 'bg-info-surface text-heading',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
