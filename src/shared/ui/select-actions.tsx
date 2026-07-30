import type { ReactNode } from 'react'
import type { MultiSelect } from '@/shared/lib'
import type { SelectActionId } from '@/shared/config/select-toolbar'
import { actionIcon } from './action-icon'

export function selectActionIcon(id: SelectActionId): ReactNode {
  return actionIcon(id, 'size-[18px]')
}

export interface SelectActionHandler {
  onAction: () => void
  disabled?: boolean
}

export type SelectActionHandlers = Partial<Record<SelectActionId, SelectActionHandler>>

/**
 * A toolbar handler that runs a command over whatever is selected. It snapshots
 * the ids, runs `run`, then leaves select mode — in that order, so `run` can
 * never read ids the exit has already cleared — and disables itself while the
 * selection is empty. Spread the result to override `disabled` where an action
 * needs a narrower rule than "something is selected".
 */
export function bulkAction(
  selection: Pick<MultiSelect, 'ids' | 'exit'>,
  run: (ids: string[]) => void,
): SelectActionHandler {
  return {
    disabled: selection.ids.size === 0,
    onAction: () => {
      const ids = [...selection.ids]
      if (ids.length === 0) return
      run(ids)
      selection.exit()
    },
  }
}
