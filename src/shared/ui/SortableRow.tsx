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
 * The one sortable element. Everything draggable — deck row, folder row, toolbar chip, swipe cap —
 * takes its transform, transition and drag handle from here, so `useSortable` is called in exactly
 * one place. The frame stays the row's own element: that is what `opacity-0` and the landing apply
 * to, and a wrapper silently changes what is hidden and what is animated.
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
