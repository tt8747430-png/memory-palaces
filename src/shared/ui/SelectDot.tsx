import { Check, Minus } from 'lucide-react'
import { cn, type SelectState } from '@/shared/lib'

export interface SelectDotProps {
  /** `checked` fills with a tick, `indeterminate` with a bar, `unchecked` is an empty ring. */
  state: SelectState
  className?: string
}

/** Multi-select checkbox affordance — an empty ring that fills to an accent tick when selected,
 *  or an accent bar when only part of its subtree is. Shared across the content editor and
 *  library. */
export function SelectDot({ state, className }: SelectDotProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
        state === 'unchecked'
          ? 'border-border bg-card text-transparent'
          : 'border-accent bg-accent text-[color:var(--surface)]',
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
