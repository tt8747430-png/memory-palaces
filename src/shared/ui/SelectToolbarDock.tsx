import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface SelectToolbarDockProps {
  children: ReactNode
  className?: string
}

export function SelectToolbarDock({ children, className }: SelectToolbarDockProps) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-300 mx-auto w-full max-w-app px-3 pt-2',
        className,
      )}
      style={{ paddingBottom: 'calc(var(--app-bottom-inset) + 0.75rem)' }}
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  )
}
