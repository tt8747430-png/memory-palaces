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
  sectionOf: (activeId: string) => readonly string[]
  selectedIds?: ReadonlySet<string>
  scopeTo?: (activeId: string) => readonly string[] | null
}

export interface SortableBlockDrop {
  order: string[]
  block: string[]
}

export interface SortableBlock {
  activeId: string | null
  carriedIds: ReadonlySet<string>
  carriedInOrder: string[]
  stackIds: string[]
  isHidden: (id: string) => boolean
  landingRef: (id: string) => (node: HTMLElement | null) => void
  isMulti: boolean
  collision: CollisionDetection
  dropAnimation: null
  start: (id: string) => void
  cancel: () => void
  drop: (event: DragEndEvent) => SortableBlockDrop | null
}

const EMPTY: ReadonlySet<string> = new Set()

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
      const origin = event.active.rect.current.translated
      const overId = event.over ? String(event.over.id) : null
      const block = carriedInOrder
      const current = section
      setActiveId(null)
      if (!overId || block.length === 0) return null

      const order = moveBlock(current, carriedIds, overId)
      if (order.every((id, i) => id === current[i])) return null

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
