import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib'

export type GlassTone = 'card' | 'sky'

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** `card` = frosted white (hero/floating), `sky` = frosted sky tint. */
  tone?: GlassTone
}

const toneStyles: Record<GlassTone, string> = {
  card: 'bg-card-glass',
  sky: 'bg-glass',
}

/** Frosted glass surface — reserved for hero/featured/floating chrome, never the
 * default card (glass is purposeful, not decoration). */
export function GlassCard({ tone = 'card', className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn('rounded-card-featured p-5 shadow-featured', toneStyles[tone], className)}
      {...props}
    />
  )
}
