import type { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import {
  Check,
  Copy,
  Flag,
  GraduationCap,
  GripVertical,
  Lightbulb,
  MapPin,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import type { Locus } from '@/entities/locus'
import type { Question } from '@/entities/question'
import { cn, useLongPress } from '@/shared/lib'
import type { SwipeConfig } from '@/shared/config/swipe'
import {
  buildSwipeActions,
  OverflowMenuButton,
  type SheetAction,
  SrsStatusChip,
  SwipeRow,
} from '@/shared/ui'

/** Props that wire a row's grip to dnd-kit's drag activator. Present only while selecting
 * (reorder mode); absent otherwise (the row renders without a handle). */
export interface RowDragHandle {
  ref: (node: HTMLElement | null) => void
  props: HTMLAttributes<HTMLButtonElement>
}

/** The left-edge grip a row shows in select mode. `self-stretch` spans the row's full height
 * so the glyph centres vertically against the whole card (not pinned to the first line);
 * `touch-none` hands the gesture to dnd-kit's pointer sensor instead of the scroller. */
function DragHandle({ handle, label }: { handle: RowDragHandle; label: string }) {
  return (
    <button
      ref={handle.ref}
      type="button"
      aria-label={label}
      className="-ml-1 grid w-7 shrink-0 cursor-grab touch-none place-items-center self-stretch rounded-control text-muted-foreground active:cursor-grabbing"
      {...handle.props}
    >
      <GripVertical className="size-5" aria-hidden />
    </button>
  )
}

export interface CardRowProps {
  locus: Locus
  index: number
  selectMode: boolean
  selected: boolean
  /** Select mode is active — show the grip and let the row be hand-dragged (reorder). */
  reorderable: boolean
  /** The grip's dnd-kit activator wiring; only supplied while `reorderable`. */
  dragHandle?: RowDragHandle
  /** The lifted clone shown in the drag overlay — drops the swipe/menu chrome. */
  dragging?: boolean
  /** The user's swipe-gesture mapping for card rows (leading/trailing action trays). */
  swipe: SwipeConfig
  onToggleSelect: () => void
  /** Long-press the row to enter select mode with this card picked. */
  onRequestSelect: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleFlag: () => void
  onMarkKnown: () => void
  onResetSrs: () => void
}

const rowSurface = 'rounded-card border bg-card p-4 shadow-rest transition-colors'

function SelectDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
        selected
          ? 'border-accent bg-accent text-[color:var(--surface)]'
          : 'border-border bg-card text-transparent',
      )}
    >
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  )
}

export function CardRow({
  locus,
  index,
  selectMode,
  selected,
  reorderable,
  dragHandle,
  dragging = false,
  swipe,
  onToggleSelect,
  onRequestSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFlag,
  onMarkKnown,
  onResetSrs,
}: CardRowProps) {
  const { t } = useTranslation()
  const longPress = useLongPress({
    onLongPress: onRequestSelect,
    onTap: selectMode ? onToggleSelect : undefined,
  })
  const { leading, trailing } = buildSwipeActions(
    swipe,
    {
      flag: {
        onAction: onToggleFlag,
        label: locus.flagged ? t('loci.row.unflag') : t('loci.row.flag'),
      },
      known: { onAction: onMarkKnown },
      reset: { onAction: onResetSrs },
      duplicate: { onAction: onDuplicate },
      delete: { onAction: onDelete },
    },
    t,
  )
  // Swipe is the at-rest gesture only: it stands down while selecting (reorder lives there
  // too) or riding in the drag overlay, so the gestures never fight.
  const swipeEnabled = !selectMode && !dragging

  const actions: SheetAction[] = [
    {
      id: 'edit',
      label: t('common.edit'),
      icon: <Pencil className="size-5" aria-hidden />,
      onSelect: onEdit,
    },
    {
      id: 'duplicate',
      label: t('loci.row.duplicate'),
      icon: <Copy className="size-5" aria-hidden />,
      onSelect: onDuplicate,
    },
    {
      id: 'flag',
      label: locus.flagged ? t('loci.row.unflag') : t('loci.row.flag'),
      icon: <Flag className="size-5" aria-hidden />,
      onSelect: onToggleFlag,
    },
    {
      id: 'known',
      label: t('loci.row.markKnown'),
      icon: <GraduationCap className="size-5" aria-hidden />,
      onSelect: onMarkKnown,
    },
    {
      id: 'reset',
      label: t('loci.row.resetSchedule'),
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

  const card = (
    <motion.div
      initial={dragging ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      {...(dragging ? {} : longPress)}
      className={cn(
        rowSurface,
        selected ? 'border-accent ring-2 ring-accent/25' : 'border-border',
        selectMode && 'cursor-pointer',
        dragging && 'shadow-elevated',
      )}
    >
      <div className="flex items-start gap-3">
        {reorderable && dragHandle ? (
          <DragHandle handle={dragHandle} label={t('loci.row.reorder')} />
        ) : null}
        {selectMode ? <SelectDot selected={selected} /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-info-surface px-1 text-[length:var(--p-text-tiny)] font-bold text-info-foreground">
              {index + 1}
            </span>
            <p className="min-w-0 flex-1 text-[length:var(--p-text-sub)] font-semibold leading-snug text-heading">
              {locus.front}
            </p>
            {locus.flagged ? (
              <Flag
                className="size-3.5 shrink-0 fill-[var(--rating)] text-[var(--rating-edge)]"
                aria-label={t('loci.row.flagged')}
              />
            ) : null}
          </div>
          <p className="mt-1 text-[length:var(--p-text-body)] leading-relaxed text-muted-foreground">
            {locus.back}
          </p>
          <div className="mt-2">
            <SrsStatusChip srs={locus.srs} />
          </div>
          {locus.hint ? (
            <div className="mt-2.5 flex items-start gap-2 rounded-control bg-info-surface px-3 py-2">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
              <p className="text-[length:var(--p-text-label)] italic leading-snug text-info-foreground">
                {locus.hint}
              </p>
            </div>
          ) : null}
          {locus.tip ? (
            <div className="mt-2 flex items-start gap-2 rounded-control bg-[var(--warning-surface)] px-3 py-2">
              <Lightbulb
                className="mt-0.5 size-3.5 shrink-0 text-[var(--warning-foreground)]"
                aria-hidden
              />
              <p className="text-[length:var(--p-text-label)] italic leading-snug text-[var(--warning-foreground)]">
                {locus.tip}
              </p>
            </div>
          ) : null}
        </div>
        {selectMode ? null : (
          <OverflowMenuButton
            variant="tint"
            size="sm"
            label={t('loci.row.menuLabel')}
            actions={actions}
          />
        )}
      </div>
    </motion.div>
  )

  if (!swipeEnabled) return card
  return (
    <SwipeRow leading={leading} trailing={trailing} className="rounded-card">
      {card}
    </SwipeRow>
  )
}

export interface QuestionRowProps {
  question: Question
  index: number
  selectMode: boolean
  selected: boolean
  /** Select mode is active — show the grip and let the row be hand-dragged (reorder). */
  reorderable: boolean
  /** The grip's dnd-kit activator wiring; only supplied while `reorderable`. */
  dragHandle?: RowDragHandle
  /** The lifted clone shown in the drag overlay — drops the swipe/menu chrome. */
  dragging?: boolean
  /** The user's swipe-gesture mapping for card rows; questions honour the duplicate/delete
   * actions in it and ignore the card-only ones. */
  swipe: SwipeConfig
  onToggleSelect: () => void
  /** Long-press the row to enter select mode with this question picked. */
  onRequestSelect: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function QuestionRow({
  question,
  index,
  selectMode,
  selected,
  reorderable,
  dragHandle,
  dragging = false,
  swipe,
  onToggleSelect,
  onRequestSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: QuestionRowProps) {
  const { t } = useTranslation()
  const longPress = useLongPress({
    onLongPress: onRequestSelect,
    onTap: selectMode ? onToggleSelect : undefined,
  })
  const { leading, trailing } = buildSwipeActions(
    swipe,
    { duplicate: { onAction: onDuplicate }, delete: { onAction: onDelete } },
    t,
  )
  const swipeEnabled = !selectMode && !reorderable && !dragging

  const actions: SheetAction[] = [
    {
      id: 'edit',
      label: t('common.edit'),
      icon: <Pencil className="size-5" aria-hidden />,
      onSelect: onEdit,
    },
    {
      id: 'duplicate',
      label: t('loci.row.duplicate'),
      icon: <Copy className="size-5" aria-hidden />,
      onSelect: onDuplicate,
    },
    {
      id: 'delete',
      label: t('common.delete'),
      icon: <Trash2 className="size-5" aria-hidden />,
      destructive: true,
      onSelect: onDelete,
    },
  ]

  const card = (
    <motion.div
      initial={dragging ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      {...(dragging ? {} : longPress)}
      className={cn(
        rowSurface,
        selected ? 'border-accent ring-2 ring-accent/25' : 'border-border',
        selectMode && 'cursor-pointer',
        dragging && 'shadow-elevated',
      )}
    >
      <div className="flex items-start gap-3">
        {reorderable && dragHandle ? (
          <DragHandle handle={dragHandle} label={t('loci.row.reorder')} />
        ) : null}
        {selectMode ? <SelectDot selected={selected} /> : null}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[length:var(--p-text-label)] font-bold text-primary-foreground">
              {index + 1}
            </span>
            <p className="min-w-0 flex-1 text-[length:var(--p-text-sub)] font-semibold leading-snug text-heading">
              {question.prompt}
            </p>
          </div>
          <ul className="flex flex-col gap-1.5">
            {question.options.map((opt, i) => {
              const correct = i === question.correctAnswer
              return (
                <li
                  key={i}
                  className={cn(
                    'flex items-center gap-2 rounded-control px-2.5 py-1.5 text-[length:var(--p-text-label)]',
                    correct
                      ? 'bg-[var(--success-surface)] font-semibold text-[var(--success-on-surface)]'
                      : 'bg-info-surface text-muted-foreground',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-5 place-items-center rounded-full text-[length:var(--p-text-tiny)] font-bold',
                      correct
                        ? 'bg-success text-[color:var(--surface)]'
                        : 'bg-card text-muted-foreground',
                    )}
                  >
                    {correct ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  {opt}
                </li>
              )
            })}
          </ul>
        </div>
        {selectMode ? null : (
          <OverflowMenuButton
            variant="tint"
            size="sm"
            label={t('loci.row.menuLabel')}
            actions={actions}
          />
        )}
      </div>
    </motion.div>
  )

  if (!swipeEnabled) return card
  return (
    <SwipeRow leading={leading} trailing={trailing} className="rounded-card">
      {card}
    </SwipeRow>
  )
}
