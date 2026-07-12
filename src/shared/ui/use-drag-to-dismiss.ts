import { type PointerEvent as ReactPointerEvent, useEffect } from 'react'
import {
  animate,
  type PanInfo,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from 'motion/react'

const DISMISS_OFFSET = 130
const DISMISS_VELOCITY = 650

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
