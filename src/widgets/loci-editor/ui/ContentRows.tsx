import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Flag,
  GraduationCap,
  Lightbulb,
  MapPin,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import type { Locus } from '@/entities/locus'
import type { Question } from '@/entities/question'
import { cn, useLongPress } from '@/shared/lib'
import { OverflowMenuButton, SrsStatusChip, type SheetAction } from '@/shared/ui'

export interface CardRowProps {
  locus: Locus
  index: number
  selectMode: boolean
  selected: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onToggleSelect: () => void
  /** Long-press the row to enter select mode with this card picked. */
  onRequestSelect: () => void
  onEdit: () => void
  onDuplicate: () => void
  onMove: (direction: 'up' | 'down') => void
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
  canMoveUp,
  canMoveDown,
  onToggleSelect,
  onRequestSelect,
  onEdit,
  onDuplicate,
  onMove,
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
    ...(canMoveUp
      ? [
          {
            id: 'up',
            label: t('loci.row.moveUp'),
            icon: <ChevronUp className="size-5" aria-hidden />,
            onSelect: () => onMove('up'),
          },
        ]
      : []),
    ...(canMoveDown
      ? [
          {
            id: 'down',
            label: t('loci.row.moveDown'),
            icon: <ChevronDown className="size-5" aria-hidden />,
            onSelect: () => onMove('down'),
          },
        ]
      : []),
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      {...longPress}
      className={cn(
        rowSurface,
        selected ? 'border-accent ring-2 ring-accent/25' : 'border-border',
        selectMode && 'cursor-pointer',
      )}
    >
      <div className="flex items-start gap-3">
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
}

export interface QuestionRowProps {
  question: Question
  index: number
  selectMode: boolean
  selected: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onToggleSelect: () => void
  /** Long-press the row to enter select mode with this question picked. */
  onRequestSelect: () => void
  onEdit: () => void
  onDuplicate: () => void
  onMove: (direction: 'up' | 'down') => void
  onDelete: () => void
}

export function QuestionRow({
  question,
  index,
  selectMode,
  selected,
  canMoveUp,
  canMoveDown,
  onToggleSelect,
  onRequestSelect,
  onEdit,
  onDuplicate,
  onMove,
  onDelete,
}: QuestionRowProps) {
  const { t } = useTranslation()
  const longPress = useLongPress({
    onLongPress: onRequestSelect,
    onTap: selectMode ? onToggleSelect : undefined,
  })

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
    ...(canMoveUp
      ? [
          {
            id: 'up',
            label: t('loci.row.moveUp'),
            icon: <ChevronUp className="size-5" aria-hidden />,
            onSelect: () => onMove('up'),
          },
        ]
      : []),
    ...(canMoveDown
      ? [
          {
            id: 'down',
            label: t('loci.row.moveDown'),
            icon: <ChevronDown className="size-5" aria-hidden />,
            onSelect: () => onMove('down'),
          },
        ]
      : []),
    {
      id: 'delete',
      label: t('common.delete'),
      icon: <Trash2 className="size-5" aria-hidden />,
      destructive: true,
      onSelect: onDelete,
    },
  ]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      {...longPress}
      className={cn(
        rowSurface,
        selected ? 'border-accent ring-2 ring-accent/25' : 'border-border',
        selectMode && 'cursor-pointer',
      )}
    >
      <div className="flex items-start gap-3">
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
}
