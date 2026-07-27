import { useTranslation } from 'react-i18next'
import { Trash2, Upload } from 'lucide-react'
import { ConfirmDialog } from '@/shared/ui'
import type { PendingAct } from '../model/use-deck-questions'

export interface QuestionDialogsProps {
  pending: PendingAct | null
  selectedCount: number
  onDismiss: () => void
  onConfirm: () => void
}

/**
 * The confirmation the pending act needs. Driven off the one `pending` value, so exactly one
 * dialog can be open and each closes by clearing it.
 */
export function QuestionDialogs({
  pending,
  selectedCount,
  onDismiss,
  onConfirm,
}: QuestionDialogsProps) {
  const { t } = useTranslation()
  if (!pending) return null

  const importing = pending.kind === 'import'
  const count = importing ? pending.questions.length : selectedCount

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onDismiss()}
      destructive={!importing}
      icon={
        importing ? (
          <Upload className="size-6" aria-hidden />
        ) : (
          <Trash2 className="size-6" aria-hidden />
        )
      }
      title={
        importing
          ? t(
              count === 1
                ? 'questions.transfer.importConfirmTitleOne'
                : 'questions.transfer.importConfirmTitleOther',
              { count },
            )
          : pending.kind === 'delete-question'
            ? t('cards.delete.questionTitle')
            : t('cards.delete.bulkTitle', { count })
      }
      description={importing ? t('questions.transfer.importConfirmBody') : t('cards.delete.body')}
      confirmLabel={importing ? t('questions.transfer.importConfirm') : t('common.delete')}
      cancelLabel={t('common.cancel')}
      onConfirm={onConfirm}
    />
  )
}
