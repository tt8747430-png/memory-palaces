import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import type { Question } from '@/entities/question'
import { Button } from '@/shared/ui'

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
      <p className="rounded-card bg-card-glass p-5 text-center shadow-rest">
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
          className="flex items-start justify-between gap-3 rounded-card bg-card-glass p-4 shadow-rest"
        >
          <div className="min-w-0">
            <h3 className="truncate text-heading">{question.prompt}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {t('questions.correctBadge', {
                answer: question.options[question.correctAnswer] ?? '',
              })}
            </p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            aria-label={t('questions.deleteLabel', { prompt: question.prompt })}
            onClick={() => onDelete(question.id)}
          >
            {t('questions.delete')}
          </Button>
        </motion.li>
      ))}
    </ul>
  )
}
