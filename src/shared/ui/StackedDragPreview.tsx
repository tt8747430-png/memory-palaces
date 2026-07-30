import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

const MAX_LAYERS = 2
const PEEK_PX = 9
const NARROW = 0.04

export interface StackedDragPreviewProps {
  count: number
  layers?: ReactNode[]
  children: ReactNode
  className?: string
}

export function StackedDragPreview({
  count,
  layers = [],
  children,
  className,
}: StackedDragPreviewProps) {
  if (count <= 1) return <>{children}</>

  const visible = layers.slice(0, Math.min(MAX_LAYERS, count - 1))

  return (
    <div className={cn('relative', className)}>
      {visible.map((layer, i) => {
        const depth = i + 1
        return (
          <span
            key={depth}
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-card shadow-card"
            style={{
              transform: `translateY(${depth * PEEK_PX}px) scaleX(${1 - depth * NARROW})`,
              transformOrigin: 'top center',
              zIndex: -depth,
            }}
          >
            {layer}
          </span>
        )
      })}

      <div className="relative">{children}</div>

      <span
        className="absolute -right-2 -top-2 z-10 grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-(length:--p-text-tiny) font-bold tabular-nums text-(--surface) shadow-interactive ring-2 ring-card"
        aria-hidden
      >
        {count}
      </span>
    </div>
  )
}
