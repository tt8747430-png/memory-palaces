import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SWAP_TRANSITION } from '@/shared/lib'
import { useHeader } from './header-context'

/**
 * Collapsed to the bar's right edge, which is where the control that raises it
 * sits — so the field reads as that control opening out, not as a new bar.
 */
const WIPE_CLOSED = 'inset(0 0 0 100%)'
const WIPE_OPEN = 'inset(0 0 0 0)'

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
          className="absolute inset-y-0 left-2 right-2 flex items-center"
        >
          {search}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
