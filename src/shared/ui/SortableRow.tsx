import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/shared/lib'

export interface SortableRowRender {
  /** Put on the row's own frame — the element that carries its surface, padding and ring. */
  frameRef: (node: HTMLElement | null) => void
  /** Attach to whatever starts the drag — usually the row's whole-surface activator button. */
  handleRef: (node: HTMLElement | null) => void
  handleProps: Record<string, unknown>
  /** This row is the one in hand. The overlay stands in for it, so the frame must go invisible. */
  isDragging: boolean
}

export interface SortableRowProps {
  id: string
  /** `li` inside a list, `div` otherwise. */
  as?: 'li' | 'div'
  /** From `useSortableBlock().landingRef` — how the row travels out of a dropped stack. */
  landingRef?: (node: HTMLElement | null) => void
  children: (render: SortableRowRender) => ReactNode
}

/**
 * One row of a reorderable list, in the two layers a drag needs it in.
 *
 * The outer element is dnd-kit's: it owns the `transform` that makes room for the row in hand. The
 * row's own frame is the child's, and it is what goes invisible while this row is the one in hand
 * (the overlay is standing in for it; rendering both leaves a ghost duplicate behind) and what a
 * landing animates — dnd-kit is not writing to it, so the two never fight over `transform`.
 *
 * The frame stays the child's own element rather than a wrapper this adds, because a row's
 * surface, ring and padding all live there: a wrapper between them would change what `opacity-0`
 * and the landing actually apply to.
 */
export function SortableRow({ id, as = 'div', landingRef, children }: SortableRowProps) {
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
      className={cn('relative', isDragging && 'z-50')}
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
