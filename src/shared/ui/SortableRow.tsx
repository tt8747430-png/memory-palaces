import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/shared/lib'

export interface SortableRowRender {
  frameRef: (node: HTMLElement | null) => void
  handleRef: (node: HTMLElement | null) => void
  handleProps: Record<string, unknown>
  isDragging: boolean
}

export interface SortableRowProps {
  id: string
  as?: 'li' | 'div'
  landingRef?: (node: HTMLElement | null) => void
  /** Sizing for the wrapper — a chip in a row needs to flex, a list row does not. */
  className?: string
  children: (render: SortableRowRender) => ReactNode
}

/**
 * The one sortable element. Everything draggable — a deck row, a folder row, a
 * toolbar chip, a swipe cap — gets its transform, its transition and its drag
 * handle from here, so `useSortable` is called in exactly one place.
 */
export function SortableRow({ id, as = 'div', landingRef, className, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const Outer = as
  return (
    <Outer
      ref={setNodeRef as never}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-50', className)}
    >
      {children({
        frameRef: landingRef ?? (() => {}),
        handleRef: setActivatorNodeRef,
        handleProps: { ...attributes, ...listeners },
        isDragging,
      })}
    </Outer>
  )
}
