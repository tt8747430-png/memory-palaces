import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface SlotCountProps {
  children: ReactNode
  /** Every slot is taken, so the count reads as a limit rather than a tally. */
  full: boolean
}

/** How much room is left on a strip of action slots — `2 / 4`, beside the strip's own name. */
export function SlotCount({ children, full }: SlotCountProps) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-tiny font-bold tabular-nums',
        full ? 'bg-info-surface text-info-foreground' : 'bg-secondary/50 text-muted-foreground',
      )}
    >
      {children}
    </span>
  )
}
