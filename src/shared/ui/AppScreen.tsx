import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

// `overscroll-contain` keeps the native iOS pull-and-bounce *inside* the content (and
// stops it chaining to the locked body). With a pinned `header` the header is a separate
// sibling of this scroller, so the bounce never moves it — only the content rubber-bands.
const SCROLL = 'overflow-y-auto overscroll-contain scrollbar-hide px-5 pb-safe'

/** The phone-first screen column: centered, capped at the app width, safe-area aware.
 * The shell itself is fixed-height and never scrolls, so the inner `<main>` is the
 * per-screen scroll container — only it scrolls, over the fixed daylight ground. Pass
 * `scrollRef` to track its scroll offset (e.g. for a collapsible header).
 *
 * Pass `header` to pin a header above the scroll container: it becomes a sibling of
 * `<main>`, not a child, so scrolling the content never moves the header — only the
 * header's own scroll-driven collapse does. */
export function AppScreen({
  children,
  className,
  scrollRef,
  header,
}: {
  children: ReactNode
  className?: string
  scrollRef?: (node: HTMLElement | null) => void
  header?: ReactNode
}) {
  if (!header) {
    return (
      <main
        ref={scrollRef}
        className={cn('mx-auto flex h-full w-full max-w-[430px] flex-col', SCROLL, className)}
      >
        {children}
      </main>
    )
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[430px] flex-col">
      {header}
      <main ref={scrollRef} className={cn('min-h-0 flex-1', SCROLL, className)}>
        {children}
      </main>
    </div>
  )
}
