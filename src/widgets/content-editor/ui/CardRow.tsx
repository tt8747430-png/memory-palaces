import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flag, Lightbulb, MapPin } from 'lucide-react'
import type { Card } from '@/entities/card'
import { buildMenuActions, SrsStatusChip } from '@/shared/ui'
import { ContentRow, type RowFrameProps, RowIndex } from './ContentRow'

export interface CardRowProps extends RowFrameProps {
  card: Card
  index: number
  onOpen: () => void
  onEdit: () => void
  onMove: () => void
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
  onMove,
  onDuplicate,
  onDelete,
  onToggleFlag,
  onMarkKnown,
  onResetSrs,
  ...frame
}: CardRowProps) {
  const { t } = useTranslation()
  const flagLabel = card.flagged ? t('cards.row.unflag') : t('cards.row.flag')

  const menuActions = buildMenuActions(
    ['edit', 'move', 'duplicate', 'flag', 'known', 'reset', 'delete'],
    {
      edit: { onAction: onEdit },
      move: { onAction: onMove },
      duplicate: { onAction: onDuplicate },
      flag: { onAction: onToggleFlag, label: flagLabel },
      known: { onAction: onMarkKnown },
      reset: { onAction: onResetSrs },
      delete: { onAction: onDelete },
    },
    t,
  )

  return (
    <ContentRow
      {...frame}
      menuActions={menuActions}
      swipeHandlers={{
        move: { onAction: onMove },
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
            className="size-3.5 shrink-0 fill-rating text-(--rating-edge)"
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
