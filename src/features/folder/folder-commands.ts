import { type Folder, type FolderChanges, updateFolder } from '@/entities/folder'
import { collectionCommands } from '@/shared/lib'

const commands = collectionCommands<'folders', Folder, FolderChanges>('folders', {
  label: 'Folder',
  update: updateFolder,
})

export const editFolder = commands.edit
export const reorderFolders = commands.reorder
