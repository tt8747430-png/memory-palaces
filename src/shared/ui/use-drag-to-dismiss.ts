import { type PointerEvent as ReactPointerEvent, useEffect } from 'react'
import {
  animate,
  type PanInfo,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from 'motion/react'

/** Distance (px) or downward velocity past which a flick/drag dismisses the sheet. */
const DISMISS_OFFSET = 130
const DISMISS_VELOCITY = 650

/**
 * Drag-to-dismiss for a bottom sheet. The returned `y` drives a `motion.div` that the user
 * can pull down by the header (`startDrag` on the header's pointer-down); release past a
 * threshold (or a fast flick) calls `onDismiss`, otherwise it springs back to rest. Dragging
 * up is pinned at 0. `y` resets whenever the sheet opens so a prior drag never lingers.
 */
export function useDragToDismiss({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  const y = useMotionValue(0)
  const controls = useDragControls()
  const reduce = useReducedMotion()

  useEffect(() => {
    if (open) y.set(0)
  }, [open, y])

  const startDrag = (event: ReactPointerEvent) => controls.start(event)

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) {
      onDismiss()
    } else {
      animate(y, 0, reduce ? { duration: 0.12 } : { type: 'spring', stiffness: 520, damping: 42 })
    }
  }

  return { y, controls, startDrag, onDragEnd }
}
