import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Copy,
  Flag,
  GraduationCap,
  Lightbulb,
  MapPin,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import type { Card } from '@/entities/card'
import type { SwipeConfig } from '@/shared/config/swipe'
import { type SheetAction, SrsStatusChip } from '@/shared/ui'
import { ContentRow, type RowDragHandle, RowIndex } from './ContentRow'

export interface CardRowProps {
  card: Card
  index: number
  selectMode: boolean
  selected: boolean
  reorderable: boolean
  dragHandle?: RowDragHandle
  dragging?: boolean
  swipe: SwipeConfig
  onToggleSelect: () => void
  onRequestSelect: () => void
  onOpen: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleFlag: () => void
  onMarkKnown: () => void
  onResetSrs: () => void
}

export function CardRow({
  card,
  index,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFlag,
  onMarkKnown,
  onResetSrs,
  ...frame
}: CardRowProps) {
  const { t } = useTranslation()
  const flagLabel = card.flagged ? t('cards.row.unflag') : t('cards.row.flag')

  const menuActions: SheetAction[] = [
    {
      id: 'edit',
      label: t('common.edit'),
      icon: <Pencil className="size-5" aria-hidden />,
      onSelect: onEdit,
    },
    {
      id: 'duplicate',
      label: t('cards.row.duplicate'),
      icon: <Copy className="size-5" aria-hidden />,
      onSelect: onDuplicate,
    },
    {
      id: 'flag',
      label: flagLabel,
      icon: <Flag className="size-5" aria-hidden />,
      onSelect: onToggleFlag,
    },
    {
      id: 'known',
      label: t('cards.row.markKnown'),
      icon: <GraduationCap className="size-5" aria-hidden />,
      onSelect: onMarkKnown,
    },
    {
      id: 'reset',
      label: t('cards.row.resetSchedule'),
      icon: <RotateCcw className="size-5" aria-hidden />,
      onSelect: onResetSrs,
    },
    {
      id: 'delete',
      label: t('common.delete'),
      icon: <Trash2 className="size-5" aria-hidden />,
      destructive: true,
      onSelect: onDelete,
    },
  ]

  return (
    <ContentRow
      {...frame}
      menuActions={menuActions}
      swipeHandlers={{
        flag: { onAction: onToggleFlag, label: flagLabel },
        known: { onAction: onMarkKnown },
        reset: { onAction: onResetSrs },
        duplicate: { onAction: onDuplicate },
        delete: { onAction: onDelete },
      }}
    >
      <div className="flex items-center gap-2">
        <RowIndex index={index} />
        <p className="min-w-0 flex-1 text-(length:--p-text-sub) font-semibold leading-snug text-heading">
          {card.front}
        </p>
        {card.flagged ? (
          <Flag
            className="size-3.5 shrink-0 fill-(--rating) text-(--rating-edge)"
            aria-label={t('cards.row.flagged')}
          />
        ) : null}
      </div>
      <p className="mt-1 text-(length:--p-text-body) leading-relaxed text-muted-foreground">
        {card.back}
      </p>
      <div className="mt-2">
        <SrsStatusChip srs={card.srs} />
      </div>
      {card.hint ? (
        <Cue
          className="mt-2.5 bg-info-surface text-info-foreground"
          icon={<MapPin className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />}
          text={card.hint}
        />
      ) : null}
      {card.tip ? (
        <Cue
          className="mt-2 bg-(--warning-surface) text-(--warning-foreground)"
          icon={
            <Lightbulb
              className="mt-0.5 size-3.5 shrink-0 text-(--warning-foreground)"
              aria-hidden
            />
          }
          text={card.tip}
        />
      ) : null}
    </ContentRow>
  )
}

function Cue({ className, icon, text }: { className: string; icon: ReactNode; text: string }) {
  return (
    <div className={`flex items-start gap-2 rounded-control px-3 py-2 ${className}`}>
      {icon}
      <p className="text-(length:--p-text-label) italic leading-snug">{text}</p>
    </div>
  )
}
