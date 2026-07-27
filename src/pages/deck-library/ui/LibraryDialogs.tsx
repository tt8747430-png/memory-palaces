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

/**
 * The confirmation the pending act needs. Driven off the one `pending` value, so exactly one
 * dialog can ever be open and each one closes by clearing that value.
 */
export function LibraryDialogs({ pending, count, onDismiss, onConfirm }: LibraryDialogsProps) {
  const { t } = useTranslation()

  // Only the deletes ask a question here; a move is answered by the move sheet instead.
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
