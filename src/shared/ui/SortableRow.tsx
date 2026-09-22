import { type ReactNode, useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/shared/lib'

/** What makes an element the row's drag handle: its ref, and the props to spread onto it. */
export interface SortableHandle {
  ref: (node: HTMLElement | null) => void
  props: Record<string, unknown>
}

export interface SortableRowRender {
  frameRef: (node: HTMLElement | null) => void
  /**
   * The drag handle. One object for as long as the drag state holds still — dnd-kit keeps its
   * attributes and listeners stable — so a memoized row handed it does not render again for it.
   */
  handle: SortableHandle
  isDragging: boolean
}

export interface SortableRowProps {
  id: string
  as?: 'li' | 'div'
  /** The row stays where it is: the list is in an order a drag is not allowed to write. */
  disabled?: boolean
  landingRef?: (node: HTMLElement | null) => void
  className?: string
  children: (render: SortableRowRender) => ReactNode
}

export function SortableRow({
  id,
  as = 'div',
  disabled = false,
  landingRef,
  className,
  children,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const handle = useMemo<SortableHandle>(
    () => ({ ref: setActivatorNodeRef, props: { ...attributes, ...listeners } }),
    [setActivatorNodeRef, attributes, listeners],
  )

  const Outer = as
  return (
    <Outer
      ref={setNodeRef as never}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-50', className)}
    >
      {children({
        frameRef: landingRef ?? (() => {}),
        handle,
        isDragging,
      })}
    </Outer>
  )
}
