import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

/** A standalone panel on the page: the card colour, lifted by its shadow. */
export const cardSurface = 'rounded-card bg-card shadow-rest'

/**
 * A note on the page — frosted card glass with a hairline edge and the resting shadow. Not a
 * tint: the page is already sky, and a sky panel on it had no edge to read and too much blue to
 * carry. A tinted fill is for a status banner, which brings its tone's own border (CODE_STYLE §5).
 */
export const noteSurface = 'rounded-card border border-border bg-card-glass shadow-rest'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card" className={cn(cardSurface, 'p-4', className)} {...props} />
}
