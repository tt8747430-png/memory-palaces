import { useCallback, useMemo, useState } from 'react'
import {
  closestCenter,
  type CollisionDetection,
  type DragEndEvent,
  pointerWithin,
} from '@dnd-kit/core'
import { moveBlock } from './move-block'
import { useStackLanding } from './use-stack-landing'

export interface SortableBlockOptions {
  /**
   * The peer list the given row reorders within — its section. A drag can only ever land among
   * peers, so this is also what bounds the block it carries.
   */
  sectionOf: (activeId: string) => readonly string[]
  /** When set, dragging a selected row carries the rest of the selection with it. */
  selectedIds?: ReadonlySet<string>
  /**
   * Narrow what a drag may even be *over*, when that is smaller than what it can land on. Return
   * `null` to leave every droppable in play — which is what a surface with an extra drop target
   * (a folder row a deck can be filed into) needs, since that target is not one of its peers.
   */
  scopeTo?: (activeId: string) => readonly string[] | null
}

export interface SortableBlockDrop {
  /** The section's new order. */
  order: string[]
  /** The rows that moved, top to bottom. */
  block: string[]
}

export interface SortableBlock {
  activeId: string | null
  /** Every row travelling with the drag, the grabbed one included. */
  carriedIds: ReadonlySet<string>
  /** Those rows in list order — the order they are picked up and put back down in. */
  carriedInOrder: string[]
  /** The pile in hand, front first: `[front, ...layers behind it]`. */
  stackIds: string[]
  /** True for a carried row that should leave the flow while the stack stands in for it. */
  isHidden: (id: string) => boolean
  /** Ref for the element a landing animates — an inner wrapper, never the sortable node. */
  landingRef: (id: string) => (node: HTMLElement | null) => void
  /** More than one row is in hand, so the drag needs the stack treatment. */
  isMulti: boolean
  /**
   * The row under the finger wins, falling back to the nearest row in the seams between rows —
   * where nothing contains the pointer. Pass straight to `DndContext`.
   */
  collision: CollisionDetection
  /**
   * What the overlay should do on release: nothing. The dropped state is already true on screen
   * the instant the finger lifts (the order is held optimistically), so an overlay still flying
   * to a row that is already sitting there is a duplicate, not a transition. A stack additionally
   * has no single row to fly *as*. Pass straight to `DragOverlay`.
   */
  dropAnimation: null
  start: (id: string) => void
  cancel: () => void
  /**
   * Settle a drop onto `overId`. Returns the section's new order and the rows that moved, or
   * `null` when nothing changed. Runs the landing itself, so the caller only has to persist.
   */
  drop: (event: DragEndEvent) => SortableBlockDrop | null
}

const EMPTY: ReadonlySet<string> = new Set()

/**
 * The drag engine every reorderable list in the app shares: which rows a drag is carrying, what
 * the pile in hand looks like, where a drop lands, and how the rows get there.
 *
 * It is headless on purpose. The surfaces differ in what they render — one flat list, two
 * sections, a tree's worth of rows collapsed to their top level — but they must not differ in how
 * a drag *behaves*, which is where the versions of this we used to keep separately drifted apart.
 *
 * Three rules it encodes:
 *
 * - **A drag stays among peers.** `sectionOf` names them; nothing outside that list can be landed
 *   on, and nothing outside it can be carried along.
 * - **A selection is one thing.** Grab any selected row and the whole selection travels, lands
 *   contiguously (`moveBlock`), and keeps its relative order.
 * - **The pile shows what you gathered.** The row on top is the one selected *most recently*, not
 *   the one the drag started from, and the rest fan out behind it newest-first.
 *
 * On release the overlay is dismissed outright (`dropAnimation`): the dropped state is already
 * true on screen, so a card still flying towards it would be a duplicate. A block's rows travel
 * from where the stack was to their own slots instead (`useStackLanding`).
 */
export function useSortableBlock({
  sectionOf,
  selectedIds,
  scopeTo,
}: SortableBlockOptions): SortableBlock {
  const [activeId, setActiveId] = useState<string | null>(null)
  const landing = useStackLanding()

  const section = useMemo(() => (activeId ? sectionOf(activeId) : []), [activeId, sectionOf])

  const carriedIds = useMemo<ReadonlySet<string>>(() => {
    if (!activeId) return EMPTY
    if (!selectedIds?.has(activeId) || selectedIds.size <= 1) return new Set([activeId])
    return new Set(section.filter((id) => selectedIds.has(id)))
  }, [activeId, selectedIds, section])

  const carriedInOrder = useMemo(
    () => section.filter((id) => carriedIds.has(id)),
    [section, carriedIds],
  )

  // `selectedIds` is a Set, and a Set keeps insertion order — so its tail is the row chosen last.
  // Deselecting and reselecting moves a row to the end, which is what "most recently" should mean.
  const stackIds = useMemo(() => {
    if (!activeId) return []
    const chosen = selectedIds
      ? [...selectedIds].filter((id) => carriedIds.has(id))
      : [...carriedIds]
    return chosen.length > 0 ? chosen.reverse() : [activeId]
  }, [activeId, selectedIds, carriedIds])

  const isHidden = useCallback(
    (id: string) => carriedIds.has(id) && id !== activeId,
    [carriedIds, activeId],
  )

  // Rect-centre proximity would hand back a neighbour of the row the finger is actually inside,
  // so the pointer decides first; `closestCenter` only covers the gaps between rows.
  const collision = useCallback<CollisionDetection>(
    (args) => {
      const scope = scopeTo?.(String(args.active.id)) ?? null
      const scoped = scope
        ? {
            ...args,
            droppableContainers: args.droppableContainers.filter((c) =>
              scope.includes(String(c.id)),
            ),
          }
        : args
      const under = pointerWithin(scoped)
      return under.length > 0 ? under : closestCenter(scoped)
    },
    [scopeTo],
  )

  const drop = useCallback(
    (event: DragEndEvent): SortableBlockDrop | null => {
      // Read what the drag was holding before the state it derives from is cleared.
      const origin = event.active.rect.current.translated
      const overId = event.over ? String(event.over.id) : null
      const block = carriedInOrder
      const current = section
      setActiveId(null)
      if (!overId || block.length === 0) return null

      const order = moveBlock(current, carriedIds, overId)
      if (order.every((id, i) => id === current[i])) return null

      // Only a block needs the travel. A single row was never gathered into a pile — the sortable
      // has been showing it in its landing slot for the whole drag, so it is already home.
      if (block.length > 1) landing.land(origin, block)
      return { order, block }
    },
    [carriedInOrder, section, carriedIds, landing],
  )

  return {
    activeId,
    carriedIds,
    carriedInOrder,
    stackIds,
    isHidden,
    landingRef: landing.register,
    isMulti: carriedIds.size > 1,
    collision,
    dropAnimation: null,
    start: setActiveId,
    cancel: useCallback(() => setActiveId(null), []),
    drop,
  }
}
