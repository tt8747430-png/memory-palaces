import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Shuffle, Timer } from 'lucide-react'
import { Sheet, Switch } from '@/shared/ui'

export interface QuizOptionsSheetProps {
  open: boolean
  onClose: () => void
  /** Auto-advance to the next question after the answer is revealed. */
  quizTimer: boolean
  /** Ask the questions in a random order (applies to the next quiz). */
  shuffleQuestions: boolean
  onQuizTimer: (value: boolean) => void
  onShuffleQuestions: (value: boolean) => void
}

/** The quiz's own options sheet — auto-advance and shuffle. These used to live in palace
 * settings; they belong with the quiz that uses them (ADR-0005). Persisted to the palace
 * by the host, so the choice is remembered. */
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
          icon={<Timer className="size-[18px]" aria-hidden />}
          label={t('quiz.options.autoAdvance')}
          description={t('quiz.options.autoAdvanceHint')}
          checked={quizTimer}
          onChange={onQuizTimer}
        />
        <ToggleRow
          icon={<Shuffle className="size-[18px]" aria-hidden />}
          label={t('quiz.options.shuffle')}
          description={t('quiz.options.shuffleHint')}
          checked={shuffleQuestions}
          onChange={onShuffleQuestions}
        />
      </div>
    </Sheet>
  )
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card bg-info-surface px-4 py-3">
      <span className="flex min-w-0 items-center gap-3">
        <span className="text-primary">{icon}</span>
        <span className="min-w-0">
          <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
            {label}
          </span>
          <span className="mt-0.5 block text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
            {description}
          </span>
        </span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  )
}
