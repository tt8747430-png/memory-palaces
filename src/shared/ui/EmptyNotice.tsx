import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface EmptyNoticeProps {
  children: ReactNode
  className?: string
}

/** The one card a list shows when it has nothing in it. */
export function EmptyNotice({ children, className }: EmptyNoticeProps) {
  return (
    <p
      className={cn(
        'rounded-card bg-card p-6 text-center text-body text-muted-foreground shadow-rest',
        className,
      )}
    >
      {children}
    </p>
  )
}
