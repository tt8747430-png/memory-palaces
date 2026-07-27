import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/shared/ui'

export interface LibraryDialogsProps {
  deckName: string | null
  onCloseDeck: () => void
  onConfirmDeck: () => void
  folderName: string | null
  onCloseFolder: () => void
  onConfirmFolder: () => void
  bulkCount: number | null
  onCloseBulk: () => void
  onConfirmBulk: () => void
}

/** The library's three destructive confirmations, kept together and away from the page body. */
export function LibraryDialogs({
  deckName,
  onCloseDeck,
  onConfirmDeck,
  folderName,
  onCloseFolder,
  onConfirmFolder,
  bulkCount,
  onCloseBulk,
  onConfirmBulk,
}: LibraryDialogsProps) {
  const { t } = useTranslation()
  const icon = <Trash2 className="size-6" aria-hidden />
  return (
    <>
      <ConfirmDialog
        open={deckName !== null}
        onOpenChange={(open) => !open && onCloseDeck()}
        icon={icon}
        title={t('deck.deleteTitle', { name: deckName ?? '' })}
        description={t('deck.deleteBody')}
        confirmLabel={t('deck.confirmDelete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={onConfirmDeck}
      />
      <ConfirmDialog
        open={folderName !== null}
        onOpenChange={(open) => !open && onCloseFolder()}
        icon={icon}
        title={t('folder.deleteTitle', { name: folderName ?? '' })}
        description={t('folder.deleteBody')}
        confirmLabel={t('folder.confirmDelete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={onConfirmFolder}
      />
      <ConfirmDialog
        open={bulkCount !== null}
        onOpenChange={(open) => !open && onCloseBulk()}
        icon={icon}
        title={t('library.select.deleteTitle', { count: bulkCount ?? 0 })}
        description={t('library.select.deleteBody')}
        confirmLabel={t('deck.confirmDelete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={onConfirmBulk}
      />
    </>
  )
}
