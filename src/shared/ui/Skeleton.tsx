import { cn } from '@/shared/lib'

export interface SkeletonProps {
  className?: string
  tone?: 'default' | 'quiet'
}

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
