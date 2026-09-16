import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { HEADER_ROW } from './Header'
import { useHeader } from './header-context'

export interface HeaderChromeProps {
  children: ReactNode
  className?: string
}

/**
 * The bar's usual contents — back pair, heading, actions — stood down rather
 * than unmounted while a search field holds the bar, so the bar comes back
 * exactly as it was. `inert` takes them out of hit-testing and the
 * accessibility tree together, which is why nothing in here needs a second
 * hidden state of its own.
 */
export function HeaderChrome({ children, className }: HeaderChromeProps) {
  const { search } = useHeader()
  const standDown = Boolean(search)
  return (
    <div
      inert={standDown || undefined}
      className={cn(
        HEADER_ROW,
        'min-w-0 flex-1',
        'transition-opacity duration-200 ease-out motion-reduce:transition-none',
        standDown && 'opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
