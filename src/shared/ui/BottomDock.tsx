import { type ReactNode, useLayoutEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { claimBottomInset, cn, EASE_EXPO, useBottomChrome } from '@/shared/lib'

/** Long enough to read as a change of mind, short enough not to delay the tap that caused it. */
const FADE = 0.2

export interface BottomDockProps {
  open: boolean
  children: ReactNode
  className?: string
}

/**
 * The one slot at the bottom of the app, and the only place its geometry is written down. The app
 * nav and the select toolbar are the same box — same width, same height, same edge — so trading one
 * for the other is a cross-fade rather than a rearrangement, and nothing above them moves.
 *
 * The inset is claimed by the box that is on screen, not by the dock, so that a box still playing
 * its exit keeps holding the slot open until it has actually gone.
 */
export function BottomDock({ open, children, className }: BottomDockProps) {
  return (
    <AnimatePresence>
      {open ? (
        <DockBox key="bottom-dock" className={className}>
          {children}
        </DockBox>
      ) : null}
    </AnimatePresence>
  )
}

function DockBox({ children, className }: { children: ReactNode; className?: string }) {
  const claimChrome = useBottomChrome()
  const reduce = useReducedMotion()

  useLayoutEffect(() => claimBottomInset(), [])

  return (
    <motion.div
      ref={claimChrome}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : FADE, ease: EASE_EXPO }}
      className={cn(
        'fixed inset-x-0 bottom-(--p-safe-bottom) z-(--z-nav) mx-auto h-16 w-64',
        'in-data-keyboard:hidden',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
