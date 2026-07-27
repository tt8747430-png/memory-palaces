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
  children: (render: SortableRowRender) => ReactNode
}

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
