import type { TFunction } from 'i18next'
import { actionIcon, type SheetAction } from '@/shared/ui'

export interface RowMenuHandlers {
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

/**
 * The overflow menu every content row offers — edit, duplicate, delete — with
 * `extra` slotted in above delete, which always sits last as the destructive one.
 */
export function rowMenuActions(
  t: TFunction,
  { onEdit, onDuplicate, onDelete }: RowMenuHandlers,
  extra: SheetAction[] = [],
): SheetAction[] {
  return [
    { id: 'edit', label: t('common.edit'), icon: actionIcon('edit'), onSelect: onEdit },
    {
      id: 'duplicate',
      label: t('cards.row.duplicate'),
      icon: actionIcon('duplicate'),
      onSelect: onDuplicate,
    },
    ...extra,
    {
      id: 'delete',
      label: t('common.delete'),
      icon: actionIcon('delete'),
      destructive: true,
      onSelect: onDelete,
    },
  ]
}
