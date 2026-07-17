import type { ReactNode } from 'react'
import { motion, type MotionValue } from 'motion/react'
import { cn } from '@/shared/lib'

export interface StickyBarProps {
  elevation: MotionValue<number>
  children: ReactNode
  className?: string
}

export function StickyBar({ elevation, children, className }: StickyBarProps) {
  return (
    <header className="relative shrink-0">
      <span aria-hidden className="absolute inset-0 border-b border-border bg-glass" />
      <motion.span
        aria-hidden
        style={{ opacity: elevation }}
        className="absolute inset-0 shadow-rest"
      />
      <div
        className={cn(
          'relative flex items-center justify-between gap-3 px-5 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)]',
          className,
        )}
      >
        {children}
      </div>
    </header>
  )
}
