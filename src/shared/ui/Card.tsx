import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib'

export const cardSurface = 'rounded-card bg-card shadow-rest'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardSurface, 'p-4', className)} {...props} />
}
