import { useTranslation } from 'react-i18next'
import { Check, Copy, Pencil, Trash2 } from 'lucide-react'
import type { Question } from '@/entities/question'
import { cn } from '@/shared/lib'
import type { SwipeConfig } from '@/shared/config/swipe'
import type { SheetAction } from '@/shared/ui'
import { ContentRow, type RowDragHandle, RowIndex } from './ContentRow'

export interface QuestionRowProps {
  question: Question
  index: number
  selectMode: boolean
  selected: boolean
  reorderable: boolean
  dragHandle?: RowDragHandle
  dragging?: boolean
  swipe: SwipeConfig
  onToggleSelect: () => void
  onRequestSelect: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function QuestionRow({
  question,
  index,
  onEdit,
  onDuplicate,
  onDelete,
  ...frame
}: QuestionRowProps) {
  const { t } = useTranslation()

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
        duplicate: { onAction: onDuplicate },
        delete: { onAction: onDelete },
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <RowIndex index={index} tone="strong" />
        <p className="min-w-0 flex-1 text-(length:--p-text-sub) font-semibold leading-snug text-heading">
          {question.prompt}
        </p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {question.options.map((option, i) => (
          <Option key={i} label={option} letter={i} correct={i === question.correctAnswer} />
        ))}
      </ul>
    </ContentRow>
  )
}

function Option({ label, letter, correct }: { label: string; letter: number; correct: boolean }) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 rounded-control px-2.5 py-1.5 text-(length:--p-text-label)',
        correct
          ? 'bg-(--success-surface) font-semibold text-(--success-on-surface)'
          : 'bg-info-surface text-muted-foreground',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-5 place-items-center rounded-full text-(length:--p-text-tiny) font-bold',
          correct ? 'bg-success text-[color:var(--surface)]' : 'bg-card text-muted-foreground',
        )}
      >
        {correct ? <Check className="size-3" strokeWidth={3} /> : String.fromCharCode(65 + letter)}
      </span>
      {label}
    </li>
  )
}
