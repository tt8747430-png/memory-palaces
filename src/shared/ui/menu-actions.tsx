import type { TFunction } from 'i18next'
import { ACTION_META, type ActionId, actionLabelKey } from '@/shared/config/actions'
import { actionIcon } from './action-icon'
import type { SheetAction } from './ActionSheet'

export type MenuActionHandlers = Partial<
  Record<
    ActionId,
    {
      onAction: () => void
      /** Overrides the registry label where the row's own state renames it. */
      label?: string
      disabled?: boolean
    }
  >
>

/**
 * The overflow-menu twin of `buildSwipeActions`: icon, label and destructive styling come from the
 * one registry; the surface decides only which actions it offers and in what order. Ids without a
 * handler are dropped, so a caller can list every action a row might have and let the handlers it
 * passes decide what appears.
 */
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
