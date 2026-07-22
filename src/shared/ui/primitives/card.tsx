import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

/** Surface classes shared by cards and card-like sections (rows, grids, list shells). */
export const cardSurface = 'rounded-card bg-card shadow-rest'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card" className={cn(cardSurface, 'p-4', className)} {...props} />
}
