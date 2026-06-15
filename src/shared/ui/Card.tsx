import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib'

/** The default content surface: a white card lifted off the daylight ground by a
 * soft navy-tinted shadow (not glass — glass is reserved for hero/floating chrome).
 * Exported as a class too, for animated list items that can't wrap in the component. */
export const cardSurface = 'rounded-card bg-card shadow-rest'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardSurface, 'p-4', className)} {...props} />
}
