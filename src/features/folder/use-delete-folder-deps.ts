import { useMemo } from 'react'
import { useFolderStoreApi } from '@/entities/folder'
import { useDeleteDeckDeps } from '@/features/deck'
import type { DeleteFolderDeps } from './delete-folder'

export function useDeleteFolderDeps(): DeleteFolderDeps {
  const deckDeps = useDeleteDeckDeps()
  const folderStore = useFolderStoreApi()
  return useMemo(() => ({ ...deckDeps, folderStore }), [deckDeps, folderStore])
}
