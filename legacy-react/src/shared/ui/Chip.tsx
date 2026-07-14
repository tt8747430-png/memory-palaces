import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export function Chip({
  children,
  icon,
  className,
}: {
  children: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-control bg-info-surface px-2.5 py-1',
        'text-[length:var(--p-text-label)] font-medium text-info-foreground',
        className,
      )}
    >
      {icon ? (
        <span className="grid place-items-center" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  )
}
