import type { ReactNode } from 'react'
import type { ActionId } from '@/shared/config/actions'

/**
 * What a surface does when one action is chosen. The same shape feeds every
 * renderer — the menu sheet, the swipe rails and the select toolbar — so an
 * action is described once and appears wherever the learner put it.
 */
export interface ActionHandler {
  onAction: () => void
  /** Overrides the registry label when the wording depends on the item's state. */
  label?: string
  /** Overrides the registry icon for the same reason. */
  icon?: ReactNode
  /** Rendered dimmed in menus and toolbars; left off the swipe rails entirely. */
  disabled?: boolean
}

export type ActionHandlers = Partial<Record<ActionId, ActionHandler>>

/**
 * One action, offered only where it applies. `when` false yields `undefined`, which every renderer
 * already treats as "not offered" — `buildSwipeActions`, `buildMenuActions` and `SelectToolbar` all
 * skip a missing handler — so an action leaves the rails, the menus and the toolbar together.
 *
 * This is the whole vocabulary for availability in an action map. Where the condition *is* the
 * handler's own optional callback, write `fn && { onAction: fn }` instead: same shape, and it lets
 * the compiler narrow the callback rather than asserting it.
 *
 * Availability is about what the surface can do, not about what is selected right now. Something
 * the learner is one tap away from enabling keeps its slot and sets `disabled` instead, so a bar
 * never resizes under a thumb.
 */
export function offer(when: boolean, handler: ActionHandler): ActionHandler | undefined {
  return when ? handler : undefined
}
