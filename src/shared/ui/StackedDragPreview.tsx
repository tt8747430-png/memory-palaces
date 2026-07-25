import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

/** How many rows peek out behind the one in hand before the count pill takes over the counting. */
const MAX_LAYERS = 2
/** Each layer sits this far below the front row, and this much narrower per step. */
const PEEK_PX = 9
const NARROW = 0.04

export interface StackedDragPreviewProps {
  /** How many rows are being carried. `1` (or less) renders the child alone, no stack. */
  count: number
  /**
   * The other carried rows, nearest-to-the-front first — the real rows, not placeholders, so the
   * pile is visibly made of this list. Clipped to the front row's frame, so rows of different
   * heights still stack into a tidy silhouette.
   */
  layers?: ReactNode[]
  children: ReactNode
  className?: string
}

/**
 * The drag preview for a multi-select drag: the row in hand, with the rows travelling under it
 * stacked behind and a count pill for the whole block.
 *
 * The layers are the actual rows re-rendered, which is what makes the pile read as *these* rows
 * rather than as decoration — same surface, same corner radius, same selected ring — and it keeps
 * the stack honest when the selection changes mid-gesture. They are clipped to the front row's
 * box rather than laid out, so a two-line card and a one-line deck pile up identically.
 *
 * Presentational and inert: the offsets are static, so there is nothing to gate on reduced motion.
 */
export function StackedDragPreview({
  count,
  layers = [],
  children,
  className,
}: StackedDragPreviewProps) {
  if (count <= 1) return <>{children}</>

  // Never promise more depth than there is: two selected rows show one layer behind, not two.
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
        className="absolute -right-2 -top-2 z-10 grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-[length:var(--p-text-tiny)] font-bold tabular-nums text-[color:var(--surface)] shadow-interactive ring-2 ring-card"
        aria-hidden
      >
        {count}
      </span>
    </div>
  )
}
