import type { ReactNode } from 'react'
import { motion, type MotionValue } from 'motion/react'
import { cn } from '@/shared/lib'

export interface StickyBarProps {
  /** Elevation 0 → 1 from `useStickyHeader`: 0 at the top, 1 once the page has scrolled.
   * Drives only the soft lift; the frosted header surface is always present. */
  elevation: MotionValue<number>
  /** The bar's row content — typically a left identity group and a right action group. */
  children: ReactNode
  className?: string
}

/**
 * The app's top-level header bar. Like the sub-screen `ScreenHeader`, it is passed to
 * `AppScreen`'s `header` slot, so it sits above the scroll container and stays put while
 * the content scrolls beneath it (it is chrome, not part of the page flow). It owns the
 * top safe-area inset and always carries a frosted glass surface + bottom hairline, so it
 * reads as a header at every scroll offset; a soft rest shadow fades in (via `elevation`)
 * once the page is scrolling, to ground it over the moving content.
 */
export function StickyBar({ elevation, children, className }: StickyBarProps) {
  return (
    <header className="relative shrink-0">
      {/* Persistent frosted header surface + edge, matching the settings ScreenHeader. */}
      <span aria-hidden className="absolute inset-0 border-b border-border bg-glass" />
      {/* A soft lift that fades in only once the content is scrolling beneath the bar. */}
      <motion.span
        aria-hidden
        style={{ opacity: elevation }}
        className="absolute inset-0 shadow-rest"
      />
      <div
        className={cn(
          'relative flex items-center justify-between gap-3 px-5 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)]',
          className,
        )}
      >
        {children}
      </div>
    </header>
  )
}
