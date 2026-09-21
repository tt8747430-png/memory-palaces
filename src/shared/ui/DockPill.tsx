import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

/**
 * The slot's surface: the glow beneath it and the two glass layers over it. Both occupants wear
 * exactly this, so a cross-fade between them never shows a seam where one material becomes another.
 */
export interface DockPillProps {
  children: ReactNode
  className?: string
}

export function DockPill({ children, className }: DockPillProps) {
  return (
    <div className="relative h-full w-full">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 scale-110 opacity-60 blur-2xl"
        style={{
          background:
            'linear-gradient(to top, color-mix(in oklch, var(--nav-surface) 26%, transparent), color-mix(in oklch, var(--accent) 12%, transparent), transparent)',
        }}
      />
      <div
        className={cn(
          'relative flex h-full w-full items-center overflow-hidden rounded-nav shadow-elevated',
          className,
        )}
      >
        <div
          aria-hidden
          className="absolute inset-0 backdrop-blur-2xl"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in oklch, var(--nav-surface) 62%, transparent), color-mix(in oklch, var(--nav-surface) 50%, transparent))',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-nav bg-linear-to-b from-white/15 to-transparent"
        />
        {children}
      </div>
    </div>
  )
}
