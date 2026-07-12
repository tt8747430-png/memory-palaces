import type { Folder } from './types'
import type { FolderState } from './store'

export const selectFolders = (state: FolderState): Folder[] => state.folders
export const selectFolderCount = (state: FolderState): number => state.folders.length
export const selectIsReady = (state: FolderState): boolean => state.status === 'ready'
