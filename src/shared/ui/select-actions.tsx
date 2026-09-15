import type { ReactNode } from 'react'
import type { MultiSelect } from '@/shared/lib'
import type { SelectActionId } from '@/shared/config/select-toolbar'
import { actionIcon } from './action-icon'
import type { ActionHandler } from './action-handlers'

export function selectActionIcon(id: SelectActionId): ReactNode {
  return actionIcon(id, 'size-[18px]')
}

export type SelectActionHandlers = Partial<Record<SelectActionId, ActionHandler>>

export function bulkAction(
  selection: Pick<MultiSelect, 'ids' | 'exit'>,
  run: (ids: string[]) => void,
): ActionHandler {
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
