import { createStoreContext } from '@/shared/lib'
import type { DeckState } from './store'

const { StoreContext, useSelector, useStoreApi } = createStoreContext<DeckState>('Deck')

export const DeckStoreContext = StoreContext
export const useDeckStore = useSelector
export const useDeckStoreApi = useStoreApi
