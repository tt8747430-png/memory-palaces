import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SWAP_TRANSITION } from '@/shared/lib'
import { useHeader } from './header-context'

/**
 * How far the field travels in from the bar's right edge, where the control that raises it sits —
 * so it reads as that control opening out rather than as a new bar.
 */
const SLIDE = 12

/**
 * The reveal moves the whole field and clips nothing. A wipe (`clip-path`) cut the field and its
 * focus ring until its last frame, and WebKit repaints a clip on the main thread — while the
 * keyboard this field raises is opening on the same one. Opacity and a translate stay on the
 * compositor.
 */
const HIDDEN = { opacity: 0, x: SLIDE }
const SHOWN = { opacity: 1, x: 0 }

/** Lays the frame's search field over the bar, in the gutter the bar itself keeps. */
export function HeaderSearch() {
  const { search } = useHeader()
  const reduce = useReducedMotion()
  const hidden = reduce ? { opacity: 0 } : HIDDEN

  return (
    <AnimatePresence initial={false}>
      {search ? (
        <motion.div
          key="search"
          initial={hidden}
          animate={SHOWN}
          exit={hidden}
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
