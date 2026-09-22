import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { EASE_EXPO, useBottomSlotTarget, useWantBottomSlot } from '@/shared/lib'

const FADE = 0.2

export interface BottomSlotProps {
  open: boolean
  children: ReactNode
}

/**
 * Borrows the bottom dock's box while `open`: the nav steps aside, the children fade in over the
 * same pill, and on close they fade out as the nav fades back. Rendered from anywhere in the
 * tree — a page owns the toolbar's handlers, the dock owns the geometry — and always mounted, so
 * an occupant torn out of the tree can still play its exit.
 */
export function BottomSlot({ open, children }: BottomSlotProps) {
  useWantBottomSlot(open)
  const target = useBottomSlotTarget()
  const reduce = useReducedMotion()

  if (!target) return null
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="occupant"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : FADE, ease: EASE_EXPO }}
          className="absolute inset-0"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    target,
  )
}
