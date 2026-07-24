import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface SelectToolbarDockProps {
  children: ReactNode
  className?: string
}

/**
 * Where a multi-selection action bar floats: pinned to the bottom, centred on
 * the app column, and — on the tab-bar routes — lifted to sit *above* the tab
 * bar instead of over it. `AppNav` publishes `--app-tab-inset` while it is
 * mounted; off those routes the variable is absent and the dock simply rests on
 * the safe area. The empty gutter stays click-through (`pointer-events-none`)
 * so the tab bar underneath keeps taking taps.
 */
export function SelectToolbarDock({ children, className }: SelectToolbarDockProps) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-[300] mx-auto w-full max-w-[430px] px-3 pt-2',
        className,
      )}
      style={{
        paddingBottom: 'calc(var(--app-tab-inset, env(safe-area-inset-bottom)) + 0.75rem)',
      }}
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  )
}
