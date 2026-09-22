import { memo, type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeftRight, Flag, Lightbulb, MapPin, Snowflake } from 'lucide-react'
import type { Card } from '@/entities/card'
import type { LearningAlgorithm } from '@/entities/deck'
import { type ActionHandlers, Chip, SrsStatusChip } from '@/shared/ui'
import { ContentRow, type RowFrameProps, RowIndex } from './ContentRow'

export interface CardRowProps extends Omit<RowFrameProps, 'id'> {
  card: Card
  index: number
  algorithm: LearningAlgorithm
  /**
   * Builds a card's whole action catalog; the rails render whatever the learner picked. One
   * function for the list, changing only when what it offers changes, so the row can build its own
   * catalog once per card instead of the list building one per row per render.
   */
  actionsFor: (card: Card) => ActionHandlers
  /** Opens the card's action sheet. Stable for the life of the list. */
  onOpenActions: (id: string) => void
}

/**
 * A card in the deck's list. Memoized: a write to one card re-renders that card's row, not the
 * list — the store hands back the same object for every card the write did not touch.
 */
export const CardRow = memo(function CardRow({
  card,
  index,
  algorithm,
  actionsFor,
  onOpenActions,
  ...frame
}: CardRowProps) {
  const { t } = useTranslation()
  const handlers = useMemo(() => actionsFor(card), [actionsFor, card])

  return (
    <ContentRow
      {...frame}
      id={card.id}
      overflow={{ kind: 'sheet', onOpen: () => onOpenActions(card.id) }}
      swipeHandlers={handlers}
    >
      <div className="flex items-center gap-2">
        <RowIndex index={index} />
        <p className="min-w-0 flex-1 text-body font-semibold leading-snug text-heading">
          {card.front}
        </p>
        {card.flagged ? (
          <Flag
            className="size-3.5 shrink-0 fill-rating text-(--rating-edge)"
            aria-label={t('cards.row.flagged')}
          />
        ) : null}
      </div>
      <p className="mt-1 text-body leading-relaxed text-muted-foreground">{card.back}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {algorithm === 'spaced' ? <SrsStatusChip srs={card.srs} /> : null}
        {card.reversed ? (
          <Chip>
            <ArrowLeftRight className="size-3" aria-hidden />
            {t('cardActions.reversedChip')}
          </Chip>
        ) : null}
        {card.frozen ? (
          <Chip>
            <Snowflake className="size-3" aria-hidden />
            {t('cardActions.frozenChip')}
          </Chip>
        ) : null}
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
})

function Cue({ className, icon, text }: { className: string; icon: ReactNode; text: string }) {
  return (
    <div className={`flex items-start gap-2 rounded-control px-3 py-2 ${className}`}>
      {icon}
      <p className="text-label italic leading-snug">{text}</p>
    </div>
  )
}
