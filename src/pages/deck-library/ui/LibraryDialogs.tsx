import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/shared/ui'
import type { PendingAct } from '../model/pending-act'

export interface LibraryDialogsProps {
  pending: PendingAct | null
  count: number
  onDismiss: () => void
  onConfirm: () => void
}

export function LibraryDialogs({ pending, count, onDismiss, onConfirm }: LibraryDialogsProps) {
  const { t } = useTranslation()

  const copy =
    pending?.kind === 'delete-deck'
      ? {
          title: t('deck.deleteTitle', { name: pending.deck.name }),
          description: t('deck.deleteBody'),
          confirmLabel: t('deck.confirmDelete'),
        }
      : pending?.kind === 'delete-folder'
        ? {
            title: t('folder.deleteTitle', { name: pending.folder.name }),
            description: t('folder.deleteBody'),
            confirmLabel: t('folder.confirmDelete'),
          }
        : pending?.kind === 'delete-selection'
          ? {
              title: t('library.select.deleteTitle', { count }),
              description: t('library.select.deleteBody'),
              confirmLabel: t('deck.confirmDelete'),
            }
          : null

  return (
    <ConfirmDialog
      open={copy !== null}
      onOpenChange={(open) => !open && onDismiss()}
      icon={<Trash2 className="size-6" aria-hidden />}
      title={copy?.title ?? ''}
      description={copy?.description ?? ''}
      confirmLabel={copy?.confirmLabel ?? ''}
      cancelLabel={t('common.cancel')}
      destructive
      onConfirm={onConfirm}
    />
  )
}
