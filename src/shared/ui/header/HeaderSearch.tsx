import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { FOCUS_RING_OVERSHOOT, SWAP_TRANSITION } from '@/shared/lib'
import { useHeader } from './header-context'

/**
 * Collapsed to the bar's right edge, which is where the control that raises it
 * sits — so the field reads as that control opening out, not as a new bar.
 * The wipe is a clip, and a clip at the box cuts the field's focus ring off on
 * three sides — so it insets outward by the ring, in every pose.
 */
const RING = `-${FOCUS_RING_OVERSHOOT}px`
const WIPE_CLOSED = `inset(${RING} ${RING} ${RING} 100%)`
const WIPE_OPEN = `inset(${RING} ${RING} ${RING} ${RING})`

/** Lays the frame's search field over the bar, in the gutter the bar itself keeps. */
export function HeaderSearch() {
  const { search } = useHeader()
  const reduce = useReducedMotion()
  const pose = (open: boolean) =>
    reduce
      ? { opacity: open ? 1 : 0 }
      : { opacity: open ? 1 : 0, clipPath: open ? WIPE_OPEN : WIPE_CLOSED }

  return (
    <AnimatePresence initial={false}>
      {search ? (
        <motion.div
          key="search"
          initial={pose(false)}
          animate={pose(true)}
          exit={pose(false)}
          transition={SWAP_TRANSITION}
          data-slot="header-search"
          // The bar's own gutter plus the ring: at the bar's `px-2` the field's focus ring would
          // land 3px from the screen edge (CODE_STYLE §5).
          className="absolute inset-y-0 left-3 right-3 flex items-center"
        >
          {search}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
