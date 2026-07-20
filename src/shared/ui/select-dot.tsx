import { Check } from 'lucide-react'
import { cn } from '@/shared/lib'

export interface SelectDotProps {
  selected: boolean
  className?: string
}

/** Multi-select checkbox affordance — an empty ring that fills to an accent
 *  check when the row is selected. Shared across the content editor and library. */
export function SelectDot({ selected, className }: SelectDotProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
        selected
          ? 'border-accent bg-accent text-[color:var(--surface)]'
          : 'border-border bg-card text-transparent',
        className,
      )}
    >
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  )
}
