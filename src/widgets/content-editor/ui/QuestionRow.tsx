import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import type { Question } from '@/entities/question'
import { cn } from '@/shared/lib'
import { buildMenuActions } from '@/shared/ui'
import { ContentRow, type RowFrameProps, RowIndex } from './ContentRow'

/** What a question row can ask for, by question. Stable for the life of the list. */
export interface QuestionRowActions {
  edit: (id: string) => void
  duplicate: (id: string) => void
  remove: (question: Question) => void
}

export interface QuestionRowProps extends Omit<RowFrameProps, 'id'> {
  question: Question
  index: number
  actions: QuestionRowActions
}

/** A question in the deck's list. Memoized, like `CardRow`, for the same reason. */
export const QuestionRow = memo(function QuestionRow({
  question,
  index,
  actions,
  ...frame
}: QuestionRowProps) {
  const { t } = useTranslation()

  const { menuActions, swipeHandlers } = useMemo(() => {
    const edit = { onAction: () => actions.edit(question.id) }
    const duplicate = { onAction: () => actions.duplicate(question.id) }
    const remove = { onAction: () => actions.remove(question) }
    return {
      menuActions: buildMenuActions(
        ['edit', 'duplicate', 'delete'],
        { edit, duplicate, delete: remove },
        t,
      ),
      swipeHandlers: { duplicate, delete: remove },
    }
  }, [actions, question, t])

  return (
    <ContentRow
      {...frame}
      id={question.id}
      overflow={{ kind: 'menu', actions: menuActions }}
      swipeHandlers={swipeHandlers}
    >
      <div className="mb-2 flex items-center gap-2">
        <RowIndex index={index} tone="strong" />
        <p className="min-w-0 flex-1 text-body font-semibold leading-snug text-heading">
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
})

function Option({ label, letter, correct }: { label: string; letter: number; correct: boolean }) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 rounded-control px-2.5 py-1.5 text-label',
        correct
          ? 'bg-(--success-surface) font-semibold text-(--success-on-surface)'
          : 'bg-info-surface text-muted-foreground',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-5 place-items-center rounded-full text-tiny font-bold',
          correct ? 'bg-success text-(--surface)' : 'bg-card text-muted-foreground',
        )}
      >
        {correct ? <Check className="size-3" strokeWidth={3} /> : String.fromCharCode(65 + letter)}
      </span>
      {label}
    </li>
  )
}
