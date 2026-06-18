import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

/** The phone-first screen column: centered, capped at the app width, safe-area aware.
 * The shell itself is fixed-height and never scrolls, so this is the per-screen scroll
 * container — only this scrolls, over the fixed daylight ground. Pass `scrollRef` to
 * track its scroll offset (e.g. for a collapsible header). */
export function AppScreen({
  children,
  className,
  scrollRef,
}: {
  children: ReactNode
  className?: string
  scrollRef?: (node: HTMLElement | null) => void
}) {
  return (
    <main
      ref={scrollRef}
      className={cn(
        'mx-auto flex h-full w-full max-w-[430px] flex-col overflow-y-auto overscroll-contain scrollbar-hide px-5 pb-safe',
        className,
      )}
    >
      {children}
    </main>
  )
}
