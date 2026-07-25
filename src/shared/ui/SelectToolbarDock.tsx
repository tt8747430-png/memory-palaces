import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface SelectToolbarDockProps {
  children: ReactNode
  className?: string
}

/**
 * Where a multi-selection action bar floats: pinned to the bottom, centred on
 * the app column, and — on the tab-bar routes — lifted to sit *above* the tab
 * bar instead of over it. `--app-bottom-inset` is the safe area alone by
 * default and grows by the tab bar's height while `AppNav` is mounted, so the
 * dock needs no route knowledge of its own. The empty gutter stays
 * click-through (`pointer-events-none`) so the tab bar underneath keeps
 * taking taps.
 */
export function SelectToolbarDock({ children, className }: SelectToolbarDockProps) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-[300] mx-auto w-full max-w-[430px] px-3 pt-2',
        className,
      )}
      style={{ paddingBottom: 'calc(var(--app-bottom-inset) + 0.75rem)' }}
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  )
}
