import { useEffect } from 'react'
import { useProfileStoreApi } from '@/entities/profile'
import { useDeckStoreApi } from '@/entities/deck'
import { useFolderStoreApi } from '@/entities/folder'
import { useCardStoreApi } from '@/entities/card'
import { useQuestionStoreApi } from '@/entities/question'
import { useProgressStoreApi } from '@/entities/progress'
import { useNotificationStoreApi } from '@/entities/notification'
import { setProfile } from '@/features/profile'
import { resetEverything } from '@/features/data'
import { forgetPhone } from './use-profile-form'

export function useDeleteAccount(): () => Promise<void> {
  const profileStore = useProfileStoreApi()
  const deckStore = useDeckStoreApi()
  const folderStore = useFolderStoreApi()
  const cardStore = useCardStoreApi()
  const questionStore = useQuestionStoreApi()
  const progressStore = useProgressStoreApi()
  const notificationStore = useNotificationStoreApi()

  useEffect(() => {
    profileStore.getState().start()
    deckStore.getState().start()
    folderStore.getState().start()
    cardStore.getState().start()
    questionStore.getState().start()
    progressStore.getState().start()
    notificationStore.getState().start()
  }, [
    profileStore,
    deckStore,
    folderStore,
    cardStore,
    questionStore,
    progressStore,
    notificationStore,
  ])

  return async () => {
    await resetEverything({
      deckStore,
      folderStore,
      cardStore,
      questionStore,
      progressStore,
      notificationStore,
    })
    await setProfile(profileStore, { name: '', username: '', email: '', bio: '', avatar: null })
    forgetPhone()
  }
}
