import { createStoreContext } from '@/shared/lib'
import type { FolderState } from './store'

const { StoreContext, useSelector, useStoreApi } = createStoreContext<FolderState>('Folder')

export const FolderStoreContext = StoreContext
export const useFolderStore = useSelector
export const useFolderStoreApi = useStoreApi
