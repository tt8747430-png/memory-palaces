import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
import { ACTION_META } from '@/shared/config/actions'
import type { SwipeActionId, SwipeConfig } from '@/shared/config/swipe'
import { actionIcon } from './action-icon'
import type { ActionHandlers } from './action-handlers'
import type { SwipeAction } from './SwipeRow'

export function swipeActionIcon(id: SwipeActionId): ReactNode {
  return actionIcon(id)
}

export function buildSwipeActions(
  config: SwipeConfig,
  handlers: ActionHandlers,
  t: TFunction,
): { leading: SwipeAction[]; trailing: SwipeAction[] } {
  const resolve = (ids: SwipeActionId[]): SwipeAction[] =>
    ids.flatMap((id) => {
      const handler = handlers[id]
      if (!handler || handler.disabled) return []
      const meta = ACTION_META[id]
      return [
        {
          id,
          icon: handler.icon ?? actionIcon(id),
          label: handler.label ?? t(meta.labelKey as never),
          accent: meta.accent,
          onAction: handler.onAction,
        },
      ]
    })
  return { leading: resolve(config.leading), trailing: resolve(config.trailing) }
}
