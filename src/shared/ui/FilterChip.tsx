import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface FilterChipProps {
  label: string
  /** Drawn while the chip is on; the off icon says what turning it on would do. */
  icon: ReactNode
  offIcon?: ReactNode
  on: boolean
  onChange: (on: boolean) => void
  className?: string
}

/**
 * A switch the width of its own label, beside a control rather than in a list — the Library's
 * "All subdecks". A card surface, not a tint: it stands on the page, and the page is already
 * tinted (CODE_STYLE §5). On, it takes the primary fill, so "on" reads at a glance.
 */
export function FilterChip({ label, icon, offIcon, on, onChange, className }: FilterChipProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-control px-2.5 text-label font-semibold shadow-rest',
        'transition-[transform,background-color,color] active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
        on ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground',
        className,
      )}
    >
      <span aria-hidden className="grid size-4 shrink-0 place-items-center [&_svg]:size-4">
        {on ? icon : (offIcon ?? icon)}
      </span>
      {label}
    </button>
  )
}
