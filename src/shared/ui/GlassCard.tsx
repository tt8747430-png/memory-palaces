import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib'

export type GlassTone = 'card' | 'sky'

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: GlassTone
}

const toneStyles: Record<GlassTone, string> = {
  card: 'bg-card-glass',
  sky: 'bg-glass',
}

export function GlassCard({ tone = 'card', className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn('rounded-card-featured p-5 shadow-featured', toneStyles[tone], className)}
      {...props}
    />
  )
}
