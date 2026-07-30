import { createStoreContext } from '@/shared/lib'
import type { ProgressState } from './store'

const { StoreContext, useSelector, useStoreApi, useStoreApiOptional } =
  createStoreContext<ProgressState>('Progress')

export const ProgressStoreContext = StoreContext
export const useProgressStore = useSelector
export const useProgressStoreApi = useStoreApi
export const useProgressStoreApiOptional = useStoreApiOptional
