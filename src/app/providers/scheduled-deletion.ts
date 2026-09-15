import { createContext, useContext } from 'react'
import type { ScheduledDeletion } from '@/shared/api'

export type ScheduledDeletionCheck =
  | { status: 'checking' }
  | { status: 'scheduled'; deletion: ScheduledDeletion }
  | { status: 'clear' }
  | { status: 'unknown' }

export interface ScheduledDeletionState {
  check: ScheduledDeletionCheck
  cancelled: () => void
}

export const ScheduledDeletionContext = createContext<ScheduledDeletionState>({
  check: { status: 'clear' },
  cancelled: () => {},
})

export const useScheduledDeletion = (): ScheduledDeletionState =>
  useContext(ScheduledDeletionContext)
