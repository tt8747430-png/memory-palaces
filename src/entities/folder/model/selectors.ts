import type { Folder } from './types'
import type { FolderState } from './store'

/** Read surface for folder state. Each returns a stable reference/primitive so
 * `useFolderStore(selector)` re-renders only when the selected value changes. */
export const selectFolders = (state: FolderState): Folder[] => state.folders
export const selectFolderCount = (state: FolderState): number => state.folders.length
export const selectIsReady = (state: FolderState): boolean => state.status === 'ready'
