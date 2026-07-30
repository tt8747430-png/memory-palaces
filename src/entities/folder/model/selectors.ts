import type { Folder } from './types'
import type { FolderState } from './store'

export const selectFolders = (state: FolderState): Folder[] => state.folders
