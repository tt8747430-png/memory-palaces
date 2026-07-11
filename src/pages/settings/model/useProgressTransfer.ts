import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useFolderStoreApi } from '@/entities/folder'
import { useDeckStoreApi } from '@/entities/deck'
import { useCardStoreApi } from '@/entities/card'
import { useQuestionStoreApi } from '@/entities/question'
import { useProgressStoreApi } from '@/entities/progress'
import { usePreferencesStoreApi } from '@/entities/preferences'
import { useProfileStoreApi } from '@/entities/profile'
import { useNotificationStoreApi } from '@/entities/notification'
import { exportProgress, importProgress, type TransferStores } from '@/features/transfer'
import { downloadText } from '@/shared/lib'

export interface ProgressTransfer {
  exportNow: () => void
  importFile: (file: File) => Promise<void>
}

/** Wires the export/import commands to the live stores for the Settings data section.
 * Starts every store so the exported snapshot is complete, then exposes a download
 * (export) and a file-restore (import) with success/error toasts. */
export function useProgressTransfer(): ProgressTransfer {
  const { t } = useTranslation()
  const folderStore = useFolderStoreApi()
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const questionStore = useQuestionStoreApi()
  const progressStore = useProgressStoreApi()
  const preferencesStore = usePreferencesStoreApi()
  const profileStore = useProfileStoreApi()
  const notificationStore = useNotificationStoreApi()

  const stores = useMemo<TransferStores>(
    () => ({
      folderStore,
      deckStore,
      cardStore,
      questionStore,
      progressStore,
      preferencesStore,
      profileStore,
      notificationStore,
    }),
    [
      folderStore,
      deckStore,
      cardStore,
      questionStore,
      progressStore,
      preferencesStore,
      profileStore,
      notificationStore,
    ],
  )

  useEffect(() => {
    for (const store of Object.values(stores)) store.getState().start()
  }, [stores])

  const exportNow = () => {
    const json = exportProgress(stores)
    downloadText(`mindscape-progress-${new Date().toISOString().slice(0, 10)}.json`, json)
    toast.success(t('settings.exportSuccess'))
  }

  const importFile = async (file: File) => {
    try {
      await importProgress(await file.text(), stores)
      toast.success(t('settings.importSuccess'))
    } catch {
      toast.error(t('settings.importError'))
    }
  }

  return { exportNow, importFile }
}
