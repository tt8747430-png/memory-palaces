import { type ReactNode, useLayoutEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  claimBottomInset,
  cn,
  EASE_EXPO,
  useBottomChrome,
  useBottomSlotStore,
  useBottomSlotWanted,
} from '@/shared/lib'
import { DockPill } from './DockPill'

/** Long enough to read as a change of mind, short enough not to delay the tap that caused it. */
const FADE = 0.2

export interface BottomDockProps {
  /** The default occupant wants the box — the nav, on a route with a tab. */
  open: boolean
  /** The default occupant. Shown while nothing else has asked for the box. */
  children: ReactNode
}

/**
 * The one slot at the bottom of the app, and the only place its geometry is written down. The
 * nav lives here by default; a `BottomSlot` borrows the box while a selection is on. The pill is
 * one surface that never fades — only the contents cross-fade over it — so two translucent bars
 * never overlap at half strength and the glass never dips to see-through mid-swap. Nothing above
 * the box moves either: it is one box, one height, one inset.
 */
export function BottomDock({ open, children }: BottomDockProps) {
  const wanted = useBottomSlotWanted()
  const reduce = useReducedMotion()
  const fade = { duration: reduce ? 0 : FADE, ease: EASE_EXPO }

  return (
    <AnimatePresence>
      {open || wanted ? (
        <DockBox key="bottom-dock" transition={fade}>
          <DockPill>
            <AnimatePresence initial={false}>
              {open && !wanted ? (
                <motion.div
                  key="default"
                  initial={{ opacity: 0, pointerEvents: 'none' }}
                  animate={{ opacity: 1, pointerEvents: 'auto' }}
                  exit={{ opacity: 0, pointerEvents: 'none' }}
                  transition={fade}
                  className="absolute inset-0"
                >
                  {children}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </DockPill>
          {/* Outside the pill, which clips to its corners: an occupant may hang a badge off one. */}
          <SlotTarget />
        </DockBox>
      ) : null}
    </AnimatePresence>
  )
}

function DockBox({
  children,
  transition,
}: {
  children: ReactNode
  transition: { duration: number; ease: typeof EASE_EXPO }
}) {
  const claimChrome = useBottomChrome()
  useLayoutEffect(() => claimBottomInset(), [])

  return (
    <motion.div
      ref={claimChrome}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
      className={cn(
        'fixed inset-x-0 bottom-(--p-safe-bottom) z-(--z-nav) mx-auto h-16 w-64',
        'in-data-keyboard:hidden',
      )}
    >
      {children}
    </motion.div>
  )
}

/**
 * The layer an occupant renders into, registered with the loan book while it exists. It takes no
 * presses of its own — its empty area must not swallow taps meant for the nav beneath — and the
 * occupant turns them on for itself while it is the one on top. `opacity: 0` hides a layer and
 * nothing else, so both halves of a cross-fade would otherwise be pressable at once (§5).
 */
function SlotTarget() {
  const setTarget = useBottomSlotStore((state) => state.setTarget)
  return (
    <div
      ref={(node) => {
        setTarget(node)
        return () => setTarget(null)
      }}
      className="pointer-events-none absolute inset-0"
    />
  )
}
