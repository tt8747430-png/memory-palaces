import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Trash2 } from 'lucide-react'
import type { Question } from '@/entities/question'
import { cn } from '@/shared/lib'
import { cardSurface, Chip, IconButton } from '@/shared/ui'

export interface QuestionListProps {
  questions: Question[]
  onDelete: (id: string) => void
}

/** Presentational list of a room's questions. Editing the full multiple-choice
 * shape is left to a later, richer editor; create + delete cover Phase 5. */
export function QuestionList({ questions, onDelete }: QuestionListProps) {
  const { t } = useTranslation()

  if (questions.length === 0) {
    return (
      <p className="rounded-card bg-card-glass p-6 text-center shadow-rest">
        {t('questions.empty')}
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {questions.map((question) => (
        <motion.li
          key={question.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardSurface, 'flex items-center gap-3 px-3 py-2.5')}
        >
          <div className="min-w-0 flex-1 px-1">
            <h3 className="truncate">{question.prompt}</h3>
            <Chip className="mt-1">
              {t('questions.correctBadge', {
                answer: question.options[question.correctAnswer] ?? '',
              })}
            </Chip>
          </div>
          <IconButton
            size="sm"
            variant="danger"
            aria-label={t('questions.deleteLabel', { prompt: question.prompt })}
            onClick={() => onDelete(question.id)}
          >
            <Trash2 className="size-4" aria-hidden />
          </IconButton>
        </motion.li>
      ))}
    </ul>
  )
}
