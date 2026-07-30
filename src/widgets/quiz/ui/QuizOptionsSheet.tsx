import { useTranslation } from 'react-i18next'
import { Shuffle, Timer } from 'lucide-react'
import { Sheet, ToggleRow } from '@/shared/ui'

export interface QuizOptionsSheetProps {
  open: boolean
  onClose: () => void
  quizTimer: boolean
  shuffleQuestions: boolean
  onQuizTimer: (value: boolean) => void
  onShuffleQuestions: (value: boolean) => void
}

export function QuizOptionsSheet({
  open,
  onClose,
  quizTimer,
  shuffleQuestions,
  onQuizTimer,
  onShuffleQuestions,
}: QuizOptionsSheetProps) {
  const { t } = useTranslation()
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()} title={t('quiz.options.title')}>
      <div className="flex flex-col gap-2.5 pb-2">
        <ToggleRow
          icon={<Timer className="size-4.5" aria-hidden />}
          label={t('quiz.options.autoAdvance')}
          description={t('quiz.options.autoAdvanceHint')}
          checked={quizTimer}
          onChange={onQuizTimer}
        />
        <ToggleRow
          icon={<Shuffle className="size-4.5" aria-hidden />}
          label={t('quiz.options.shuffle')}
          description={t('quiz.options.shuffleHint')}
          checked={shuffleQuestions}
          onChange={onShuffleQuestions}
        />
      </div>
    </Sheet>
  )
}
