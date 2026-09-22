import { useState } from 'react'
import {
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  type DndContextProps,
  type DropAnimation,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { EASE_OUT_CSS, useHeldOrder, useSortableSensors } from '@/shared/lib'

/** How a dropped tile settles into its slot — one motion for every editor (ADR 0001). */
const DROP_ANIMATION: DropAnimation = { duration: 200, easing: EASE_OUT_CSS }

export interface SortableList<T extends string> {
  /** The order to draw: what the last drop asked for, until the store says the same. */
  items: readonly T[]
  /** The item under the finger, for the drag overlay. */
  activeId: T | null
  /** Spread onto the `DndContext` — sensors, collision detection and the three drag handlers. */
  dnd: Pick<
    DndContextProps,
    'sensors' | 'collisionDetection' | 'onDragStart' | 'onDragEnd' | 'onDragCancel'
  >
  /** Spread onto the `DragOverlay`. */
  overlay: { dropAnimation: DropAnimation }
}

export interface SortableListOptions<T extends string> {
  ids: readonly T[]
  /**
   * Where the dropped order goes. Returning `false` refuses the drop — the list snaps back, which
   * is the only honest way to say "that rail is full" mid-gesture.
   */
  onDrop: (next: T[]) => boolean | void
}

/**
 * One sortable list, and everything the action editors share about dragging within it: the held
 * order, the sensors, the active id, the drop animation, and a drop that may be refused.
 *
 * The hold is the point (CODE_STYLE §10, cause 1). A reorder is one write per row, so the store
 * re-emits half-applied states and the tiles snap back under the finger unless the dropped order is
 * kept on screen until the incoming ids agree.
 */
export function useSortableList<T extends string>({
  ids,
  onDrop,
}: SortableListOptions<T>): SortableList<T> {
  const sensors = useSortableSensors()
  const [activeId, setActiveId] = useState<T | null>(null)
  const { order: items, hold } = useHeldOrder(ids)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const from = items.indexOf(active.id as T)
    const to = items.indexOf(over.id as T)
    if (from < 0 || to < 0) return
    const next = arrayMove([...items], from, to)
    if (onDrop(next) === false) return
    hold(next)
  }

  return {
    items,
    activeId,
    dnd: {
      sensors,
      collisionDetection: closestCenter,
      onDragStart: (event: DragStartEvent) => setActiveId(event.active.id as T),
      onDragEnd: handleDragEnd,
      onDragCancel: () => setActiveId(null),
    },
    overlay: { dropAnimation: DROP_ANIMATION },
  }
}
