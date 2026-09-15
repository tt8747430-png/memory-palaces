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
