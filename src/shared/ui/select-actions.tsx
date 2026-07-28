import type { ReactNode } from 'react'
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
