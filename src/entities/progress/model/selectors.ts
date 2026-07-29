import type { Progress } from './types'
import type { ProgressState } from './store'

export const selectProgress = (state: ProgressState): Progress | null => state.progress
