import { cn } from '@/shared/lib'

export interface SkeletonProps {
  className?: string
  /** `quiet` sits a step further back, for secondary lines inside a block. */
  tone?: 'default' | 'quiet'
}

/** One pulsing placeholder block. Size and shape come from `className`. */
export function Skeleton({ className, tone = 'default' }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-pulse rounded-full',
        tone === 'quiet' ? 'bg-secondary/20' : 'bg-secondary/30',
        className,
      )}
    />
  )
}
