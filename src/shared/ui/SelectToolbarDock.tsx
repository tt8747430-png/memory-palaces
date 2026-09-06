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
        'pointer-events-none fixed inset-x-0 bottom-0 z-(--z-dock) mx-auto w-full max-w-app px-3 pt-2',
        // WebKit re-clamps bottom-anchored fixed boxes to the visual viewport when the keyboard
        // shows, which floats the toolbar mid-screen. AppNav, SpeedDial and AppScreen's footer
        // dock yield for the same reason. CODE_STYLE §11.
        'in-data-keyboard:hidden',
        className,
      )}
      style={{ paddingBottom: 'calc(var(--app-bottom-inset) + 0.75rem)' }}
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  )
}
