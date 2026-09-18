import { createStoreContext } from '@/shared/lib'
import type { BibleVerseState } from './store'

const { StoreContext, useSelector, useStoreApi } = createStoreContext<BibleVerseState>('BibleVerse')

export const BibleVerseStoreContext = StoreContext
export const useBibleVerseStore = useSelector
export const useBibleVerseStoreApi = useStoreApi
