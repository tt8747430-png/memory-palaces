import { useTranslation } from 'react-i18next'
import { Archive, Copy, RotateCcw, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/shared/ui'
import type { DeckSettingsModel } from '../model/use-deck-settings'

export interface DeckSettingsDialogsProps {
  page: DeckSettingsModel
  deckName: string
}

/**
 * Every yes/no this screen can ask, in one place — the same shape `LibraryDialogs` uses. Only one
 * can be open, because `confirming` is one value, and each answers with the same `page.confirm`:
 * `usePendingAct` holds which act is pending and hands it over exactly once.
 */
export function DeckSettingsDialogs({ page, deckName }: DeckSettingsDialogsProps) {
  const { t } = useTranslation()
  return (
    <>
      <ConfirmDialog
        open={page.confirming === 'duplicate'}
        onOpenChange={page.onConfirmOpenChange('duplicate')}
        icon={<Copy className="size-6" aria-hidden />}
        title={t('deckSettings.duplicateConfirm.title')}
        description={t('deckSettings.duplicateConfirm.body', { name: deckName })}
        confirmLabel={t('deckSettings.duplicateConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={page.confirm}
      />

      <ConfirmDialog
        open={page.confirming === 'archive'}
        onOpenChange={page.onConfirmOpenChange('archive')}
        icon={<Archive className="size-6" aria-hidden />}
        title={t('deckSettings.archiveConfirm.title')}
        description={t('deckSettings.archiveConfirm.body', { name: deckName })}
        confirmLabel={t('deckSettings.archiveConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={page.confirm}
      />

      <ConfirmDialog
        open={page.confirming === 'reset'}
        onOpenChange={page.onConfirmOpenChange('reset')}
        icon={<RotateCcw className="size-6" aria-hidden />}
        title={t('deckSettings.resetConfirm.title')}
        description={t('deckSettings.resetConfirm.body')}
        confirmLabel={t('deckSettings.resetConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={page.confirm}
      />

      <ConfirmDialog
        open={page.confirming === 'delete'}
        onOpenChange={page.onConfirmOpenChange('delete')}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('deckSettings.deleteConfirm.title', { name: deckName })}
        description={t('deckSettings.deleteConfirm.body')}
        confirmLabel={t('deckSettings.deleteConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={page.confirm}
      />
    </>
  )
}
