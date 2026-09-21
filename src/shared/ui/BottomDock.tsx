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

/**
 * The slot's surface: the glow beneath it and the two glass layers over it. Both occupants wear
 * exactly this, so a cross-fade between them never shows a seam where one material becomes another.
 */
export function DockPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="relative h-full w-full">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 scale-110 opacity-60 blur-2xl"
        style={{
          background:
            'linear-gradient(to top, color-mix(in oklch, var(--nav-surface) 26%, transparent), color-mix(in oklch, var(--accent) 12%, transparent), transparent)',
        }}
      />
      <div
        className={cn(
          'relative flex h-full w-full items-center overflow-hidden rounded-nav shadow-elevated',
          className,
        )}
      >
        <div
          aria-hidden
          className="absolute inset-0 backdrop-blur-2xl"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in oklch, var(--nav-surface) 62%, transparent), color-mix(in oklch, var(--nav-surface) 50%, transparent))',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-nav bg-linear-to-b from-white/15 to-transparent"
        />
        {children}
      </div>
    </div>
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
