import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { readAnkiFile } from '@/features/content'
import { importErrorMessage } from '@/shared/lib'
import { useImportDraft } from './import-draft'

/**
 * The one way a file becomes cards: read it, refuse an empty or unreadable one out loud, and leave
 * the result in the draft the review screen reads. Every importing surface — the library, the deck
 * content editor, deck settings — went through these same four steps by hand; the only thing they
 * actually differ on is where the review happens, which is what `onReady` says.
 */
export function useImportFile() {
  const { t } = useTranslation()
  const setDraft = useImportDraft((s) => s.setDraft)

  return async (file: File, onReady: () => void | Promise<void>) => {
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
  }
}
