import { useMemo } from 'react'
import { useStorage } from '@/shared/lib'
import { selectAccountId, useSessionStore } from '@/entities/session'
import { useDeckStoreApi } from '@/entities/deck'
import { useCardStoreApi } from '@/entities/card'
import { useQuestionStoreApi } from '@/entities/question'
import type { DeleteDeckDeps } from './delete-deck'

export function useDeleteDeckDeps(): DeleteDeckDeps {
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const questionStore = useQuestionStoreApi()
  const storage = useStorage()
  const userId = useSessionStore(selectAccountId)
  return useMemo(
    () => ({ deckStore, cardStore, questionStore, storage, userId }),
    [deckStore, cardStore, questionStore, storage, userId],
  )
}
