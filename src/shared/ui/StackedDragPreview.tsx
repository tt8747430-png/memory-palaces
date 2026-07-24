import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface StackedDragPreviewProps {
  /** How many items are being carried. `1` (or less) renders the child alone, no stack. */
  count: number
  children: ReactNode
  className?: string
}

/**
 * The drag preview for a multi-select drag: the row in hand with up to two offset "cards"
 * peeking out behind it and a count pill, so lifting three decks looks like carrying three
 * rather than one. Purely presentational — the offsets are static, so there is nothing to
 * gate on reduced motion.
 */
export function StackedDragPreview({ count, children, className }: StackedDragPreviewProps) {
  if (count <= 1) return <>{children}</>
  const layers = Math.min(count - 1, 2)

  return (
    <div className={cn('relative', className)}>
      {Array.from({ length: layers }).map((_, i) => {
        const depth = layers - i
        return (
          <span
            key={i}
            aria-hidden
            className="absolute inset-0 rounded-card bg-card shadow-card ring-1 ring-border/50"
            style={{ transform: `translate(${depth * 5}px, ${depth * 5}px)`, zIndex: -depth }}
          />
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
