import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

/**
 * The shared reorder-gesture policy for every sortable list (library, rooms, cards, questions).
 *
 * On **touch**, a drag begins only after a deliberate press-and-hold (250 ms) with the finger
 * near-still (5 px tolerance) — so a quick tap still selects and a swipe still scrolls the list,
 * and a card is never dragged by accident on the first stray movement. That 250 ms / 5 px is
 * dnd-kit's own touch default: long enough to tell a hold from a scroll, short enough to stay
 * snappy. On a **mouse**, a small movement (8 px) starts the drag, which is the natural desktop
 * feel. Keyboard reordering is wired through the sortable coordinate getter.
 *
 * Rows using this must let the pre-hold scroll through — allow vertical panning (`touch-pan-y`),
 * never `touch-action: none`, on the draggable element while selecting.
 */
export function useSortableSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
}
