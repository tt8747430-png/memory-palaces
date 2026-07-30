import { Check, Minus } from 'lucide-react'
import { cn, type SelectState } from '@/shared/lib'

export interface SelectDotProps {
  state: SelectState
  className?: string
}

export function SelectDot({ state, className }: SelectDotProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
        state === 'unchecked'
          ? 'border-border bg-card text-transparent'
          : 'border-accent bg-accent text-(--surface)',
        className,
      )}
    >
      {state === 'indeterminate' ? (
        <Minus className="size-3.5" strokeWidth={3} />
      ) : (
        <Check className="size-3.5" strokeWidth={3} />
      )}
    </span>
  )
}
