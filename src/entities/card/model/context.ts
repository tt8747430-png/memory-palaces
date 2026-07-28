import { createStoreContext } from '@/shared/lib'
import type { CardState } from './store'

const { StoreContext, useSelector, useStoreApi } = createStoreContext<CardState>('Card')

export const CardStoreContext = StoreContext
export const useCardStore = useSelector
export const useCardStoreApi = useStoreApi
