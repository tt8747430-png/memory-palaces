import type { TFunction } from 'i18next'
import { ACTION_META, type ActionId, actionLabelKey } from '@/shared/config/actions'
import { actionIcon } from './action-icon'
import type { ActionHandlers } from './action-handlers'
import type { SheetAction } from './ActionSheet'

export function buildMenuActions(
  ids: readonly ActionId[],
  handlers: ActionHandlers,
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
        icon: handler.icon ?? actionIcon(id),
        destructive: meta.destructive,
        disabled: handler.disabled,
        onSelect: handler.onAction,
      } satisfies SheetAction,
    ]
  })
}
