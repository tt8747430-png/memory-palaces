import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/shared/lib'
import type { OptionDisplay } from '../model/option-state'

const TONE: Record<OptionDisplay, string> = {
  idle: 'border-border bg-card text-heading',
  selected: 'border-secondary bg-info-surface text-heading',
  correct: 'border-(--success) bg-(--success-surface) text-(--success-on-surface)',
  wrong: 'border-(--danger) bg-(--danger-surface) text-(--danger-on-surface)',
}

export interface QuizOptionProps {
  letter: string
  option: string
  state: OptionDisplay
  disabled: boolean
  onClick: () => void
}

export function QuizOption({ letter, option, state, disabled, onClick }: QuizOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-between rounded-control border-2 p-4 text-left transition-transform active:scale-[0.99]',
        TONE[state],
      )}
    >
      <span className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-control bg-card text-(length:--p-text-label) font-semibold text-muted-foreground">
          {letter}
        </span>
        <span className="font-medium">{option}</span>
      </span>
      {state === 'correct' ? <CheckCircle2 className="size-5" aria-hidden /> : null}
      {state === 'wrong' ? <XCircle className="size-5" aria-hidden /> : null}
    </button>
  )
}
