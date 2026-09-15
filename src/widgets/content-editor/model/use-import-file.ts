import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { readAnkiFile } from '@/features/content'
import { importErrorMessage } from '@/shared/lib'
import { useImportDraft } from './import-draft'

export function useImportFile() {
  const { t } = useTranslation()
  const setDraft = useImportDraft((s) => s.setDraft)

  return useCallback(
    async (file: File, onReady: () => void | Promise<void>) => {
      try {
        const parsed = await readAnkiFile(file)
        if (parsed.cards.length === 0) {
          toast.error(t('cards.transfer.noCardsFound'))
          return
        }
        setDraft('anki', parsed.cards)
        await onReady()
      } catch (error) {
        toast.error(importErrorMessage(error, t('cards.transfer.importFailed')))
      }
    },
    [t, setDraft],
  )
}
