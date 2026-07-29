import { useTranslation } from 'react-i18next'
import { buildMenuActions, FlyoutMenu, Switch } from '@/shared/ui'
import type { DraftCard } from '@/widgets/content-editor'

export function RestoreToggle({
  label,
  checked,
  onChange,
  last = false,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  last?: boolean
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 px-4 py-3 ${last ? '' : 'border-b border-border'}`}
    >
      <span className="text-(length:--p-text-body) font-medium text-heading">{label}</span>
      <Switch label={label} checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

export function ReviewRow({
  card,
  onEdit,
  onDelete,
}: {
  card: DraftCard
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 rounded-card border border-border bg-card p-4 shadow-rest">
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="truncate text-(length:--p-text-sub) font-semibold text-heading">
          {card.front}
        </p>
        <p className="mt-0.5 truncate text-(length:--p-text-label) text-muted-foreground">
          {card.back}
        </p>
      </button>
      <FlyoutMenu
        variant="tint"
        size="sm"
        label={t('cards.row.menuLabel')}
        actions={buildMenuActions(
          ['edit', 'delete'],
          { edit: { onAction: onEdit }, delete: { onAction: onDelete } },
          t,
        )}
      />
    </div>
  )
}
