import type { ReactNode } from 'react'
import { cn, useBottomChrome } from '@/shared/lib'

export interface SelectToolbarDockProps {
  children: ReactNode
  className?: string
}

export function SelectToolbarDock({ children, className }: SelectToolbarDockProps) {
  const claimChrome = useBottomChrome()

  return (
    <div
      ref={claimChrome}
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-(--z-dock) mx-auto w-full max-w-app px-4 pt-3',
        'in-data-keyboard:hidden',
        className,
      )}
      style={{ paddingBottom: 'calc(var(--app-bottom-inset) + 0.75rem)' }}
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  )
}
