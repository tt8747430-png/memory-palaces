import type { TFunction } from 'i18next'
import { ACTION_META, type ActionId, actionLabelKey } from '@/shared/config/actions'
import { actionIcon } from './action-icon'
import type { SheetAction } from './ActionSheet'

export type MenuActionHandlers = Partial<
  Record<
    ActionId,
    {
      onAction: () => void
      label?: string
      disabled?: boolean
    }
  >
>

export function buildMenuActions(
  ids: readonly ActionId[],
  handlers: MenuActionHandlers,
  t: TFunction,
): SheetAction[] {
  return ids.flatMap((id) => {
    const handler = handlers[id]
    if (!handler) return []
    const meta = ACTION_META[id]
    return [
      {
        id,
        label: handler.label ?? t(actionLabelKey(id, 'menu') as never),
        icon: actionIcon(id),
        destructive: meta.destructive,
        disabled: handler.disabled,
        onSelect: handler.onAction,
      } satisfies SheetAction,
    ]
  })
}
