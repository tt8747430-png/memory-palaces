import { cn } from '@/shared/lib'

export interface TierPipsProps {
  total: number
  filled: number
  className?: string
}

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
