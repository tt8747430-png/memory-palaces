import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn, useHeaderElevation } from '@/shared/lib'

const BAR = 'relative flex h-16 shrink-0 items-center gap-1 px-2'

export interface HeaderBarProps {
  children: ReactNode
  className?: string
}

export function HeaderBar({ children, className }: HeaderBarProps) {
  const elevation = useHeaderElevation()
  return (
    <header className="relative z-20 shrink-0 translate-y-[var(--vv-top,0px)] bg-glass pt-safe">
      <motion.span
        aria-hidden
        style={{ opacity: elevation }}
        className="pointer-events-none absolute inset-0 border-b border-border shadow-rest"
      />
      <div className={cn(BAR, className)}>{children}</div>
    </header>
  )
}
