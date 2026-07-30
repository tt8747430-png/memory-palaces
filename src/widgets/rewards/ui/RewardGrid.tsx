import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE_OUT } from '@/shared/lib'

const STAGGER = 0.04

export interface RewardGridProps<T> {
  items: ReadonlyArray<T>
  keyOf: (item: T) => string
  children: (item: T) => ReactNode
}

/** The three-across medallion grid, staggering its tiles in on first paint. */
export function RewardGrid<T>({ items, keyOf, children }: RewardGridProps<T>) {
  return (
    <ul className="grid grid-cols-3 gap-x-3 gap-y-7">
      {items.map((item, index) => (
        <motion.li
          key={keyOf(item)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * STAGGER, ease: EASE_OUT, duration: 0.3 }}
        >
          {children(item)}
        </motion.li>
      ))}
    </ul>
  )
}

export interface RewardTileProps {
  onOpen?: () => void
  ariaLabel: string
  children: ReactNode
}

/** One grid cell — a button when it leads somewhere, plain text when it does not. */
export function RewardTile({ onOpen, ariaLabel, children }: RewardTileProps) {
  const className = 'flex w-full flex-col items-center gap-2 text-center'
  if (!onOpen) return <div className={className}>{children}</div>
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={ariaLabel}
      className={`${className} rounded-card py-1 transition-transform duration-200 ease-out active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
    >
      {children}
    </button>
  )
}
