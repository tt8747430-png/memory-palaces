import { cn } from '@/shared/lib'

export interface TierPipsProps {
  /** How many tiers this badge has. */
  total: number
  /** How many are reached (filled). */
  filled: number
  className?: string
}

/** A row of small pips, one per tier, filled up to the reached tier. The quiet signal
 * that a badge *levels up* (vs a one-shot achievement, which never shows pips). Decorative
 * here: the adjacent "Tier x of y" text carries the same meaning for assistive tech. */
export function TierPips({ total, filled, className }: TierPipsProps) {
  return (
    <span aria-hidden className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn('size-1.5 rounded-full', index < filled ? 'bg-accent' : 'bg-primary/15')}
        />
      ))}
    </span>
  )
}
