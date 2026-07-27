import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn, useHeaderElevation } from '@/shared/lib'

/**
 * Every screen's header is exactly this tall below the safe area, whatever it holds — a back
 * chevron, a selection count, or the home avatar and its XP bar. A fixed height is what keeps
 * navigating between screens from nudging the content down and up again.
 */
const BAR = 'relative flex h-16 shrink-0 items-center gap-1 px-2'

export interface HeaderBarProps {
  children: ReactNode
  className?: string
}

/**
 * The chrome shared by every header in the app: safe-area inset, glass background, one fixed
 * height, and a shadow that fades in as the screen scrolls under it.
 *
 * The elevation comes from `AppScreen` through context — the screen owns the scroller, so no page
 * has to thread a ref from its header to its body.
 *
 * Header controls are `IconButton`s at the default `md` size in the `glass` variant, so the back
 * chevron and whatever sits opposite it read as the same control. Layout inside the bar belongs
 * to the header composing it (`ScreenHeader`, `SelectHeader`, `HomeHeader`, `ProfileBar`).
 */
export function HeaderBar({ children, className }: HeaderBarProps) {
  const elevation = useHeaderElevation()
  return (
    <header className="relative shrink-0 bg-glass pt-safe">
      <motion.span
        aria-hidden
        style={{ opacity: elevation }}
        className="pointer-events-none absolute inset-0 border-b border-border shadow-rest"
      />
      <div className={cn(BAR, className)}>{children}</div>
    </header>
  )
}
