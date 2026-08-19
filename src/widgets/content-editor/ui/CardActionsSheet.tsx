import { useTranslation } from 'react-i18next'
import {
  ArrowLeftRight,
  CheckSquare,
  Copy,
  FolderInput,
  History,
  Pencil,
  Snowflake,
  Trash2,
} from 'lucide-react'
import type { Card } from '@/entities/card'
import { ActionSheet } from '@/shared/ui'

export interface CardActionHandlers {
  onSelect: () => void
  onEdit: () => void
  onFreeze: () => void
  onMove: () => void
  onReverse: () => void
  onDuplicate: () => void
  onHistory: () => void
  onDelete: () => void
}

export interface CardActionsSheetProps {
  card: Card
  open: boolean
  onOpenChange: (open: boolean) => void
  handlers: CardActionHandlers
}

/**
 * Everything a single card can be told to do. Freeze and Reverse read off the card's own state, so
 * the sheet always offers the move the learner can actually make next.
 */
export function CardActionsSheet({ card, open, onOpenChange, handlers }: CardActionsSheetProps) {
  const { t } = useTranslation()

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      hideTitle
      variant="filled"
      title={t('cardActions.title')}
      actions={[
        {
          id: 'select',
          label: t('cardActions.select'),
          icon: <CheckSquare className="size-5" aria-hidden />,
          onSelect: handlers.onSelect,
        },
        {
          id: 'edit',
          label: t('cardActions.edit'),
          icon: <Pencil className="size-5" aria-hidden />,
          onSelect: handlers.onEdit,
        },
        {
          id: 'freeze',
          label: card.frozen ? t('cardActions.unfreeze') : t('cardActions.freeze'),
          icon: <Snowflake className="size-5" aria-hidden />,
          onSelect: handlers.onFreeze,
        },
        {
          id: 'move',
          label: t('cardActions.move'),
          icon: <FolderInput className="size-5" aria-hidden />,
          onSelect: handlers.onMove,
        },
        {
          id: 'reverse',
          label: card.reversed ? t('cardActions.unreverse') : t('cardActions.reverse'),
          icon: <ArrowLeftRight className="size-5" aria-hidden />,
          onSelect: handlers.onReverse,
        },
        {
          id: 'duplicate',
          label: t('cardActions.duplicate'),
          icon: <Copy className="size-5" aria-hidden />,
          onSelect: handlers.onDuplicate,
        },
        {
          id: 'history',
          label: t('cardActions.history'),
          icon: <History className="size-5" aria-hidden />,
          onSelect: handlers.onHistory,
        },
        {
          id: 'delete',
          label: t('cardActions.delete'),
          icon: <Trash2 className="size-5" aria-hidden />,
          destructive: true,
          onSelect: handlers.onDelete,
        },
      ]}
    />
  )
}
