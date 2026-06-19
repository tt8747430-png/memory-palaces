import type { ReactNode } from 'react'
import { motion, type MotionValue } from 'motion/react'
import { cn } from '@/shared/lib'

export interface StickyBarProps {
  /** Elevation 0 → 1 from `useStickyHeader`: 0 is the transparent rest state, 1 the
   * glass + hairline edge once the page has scrolled under the bar. */
  elevation: MotionValue<number>
  /** The bar's row content — typically a left identity group and a right action group. */
  children: ReactNode
  className?: string
}

/**
 * The app's single persistent top bar. It keeps the same size and controls at every
 * scroll offset; only its background changes. At the top it is fully transparent and
 * borderless, so it merges seamlessly into the daylight ground and the screen reads as
 * one surface. As content scrolls under it, a glass background + bottom hairline + rest
 * shadow fade in (driven by `elevation`), so the bar reads as distinct chrome and the
 * content tucks cleanly beneath it. Sticky inside the screen's scroll container, bleeding
 * to the full app width past the column padding.
 */
export function StickyBar({ elevation, children, className }: StickyBarProps) {
  return (
    <div className="sticky top-0 z-[100] -mx-5">
      <motion.span
        aria-hidden
        style={{ opacity: elevation }}
        className="absolute inset-0 border-b border-border bg-card-glass shadow-rest"
      />
      <div
        className={cn(
          'relative flex items-center justify-between gap-3 px-5 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)]',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
