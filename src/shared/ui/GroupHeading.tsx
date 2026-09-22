import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface GroupHeadingProps {
  children: ReactNode
  className?: string
}

/**
 * The name of the shelf the rows under it sit on — the heading a contributed order prints between
 * its groups. A list item, not a heading element: it belongs to the list it divides, and every
 * list that shows one is already labelled.
 */
export function GroupHeading({ children, className }: GroupHeadingProps) {
  return (
    <li
      role="presentation"
      className={cn(
        'px-1 pb-1 pt-2 text-tiny font-bold uppercase tracking-wider text-muted-foreground first:pt-0',
        className,
      )}
    >
      {children}
    </li>
  )
}
