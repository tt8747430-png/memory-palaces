import { motion } from 'motion/react'
import { cn, useHeaderElevation } from '@/shared/lib'
import { Header, type HeaderProps } from './Header'

/**
 * Stacked over the scroller and frosted, because the body passes underneath the bar rather than
 * stopping at it.
 */
const GLASS = 'relative z-(--z-header) shrink-0 bg-glass'

/**
 * The hairline and shadow the bar lifts once the body has moved under it. `AppScreen` owns the
 * scroller and publishes the elevation; the bar only reads it, so no screen wires a ref.
 */
function HeaderLift() {
  const elevation = useHeaderElevation()
  return (
    <motion.span
      aria-hidden
      style={{ opacity: elevation }}
      className="pointer-events-none absolute inset-0 border-b border-border shadow-rest"
    />
  )
}

/**
 * The `Header` frame wearing the app's own chrome — every screen that scrolls under its bar.
 *
 * A separate composition rather than a `surface` prop on the frame, so the glass stays out of the
 * modules a card scene reaches: `StudySessionHeader` renders the bare frame, and a printed scene
 * never inherits a surface it has no colour for. `scene-chrome.test.ts` is what holds that line.
 */
export function AppHeader(props: HeaderProps) {
  return (
    <Header {...props} className={cn(GLASS, props.className)}>
      <HeaderLift />
      {props.children}
    </Header>
  )
}
