import { type ReactNode, useCallback, useLayoutEffect, useRef } from 'react'
import { cn } from '@/shared/lib'

// `overscroll-contain` keeps the native iOS pull-and-bounce inside this scroller (and
// stops it chaining to the locked body).
const SCROLL = 'overflow-y-auto overscroll-contain scrollbar-hide px-5 pb-safe'

// Short screens don't overflow, so iOS has nothing to rubber-band against and the page
// feels dead on pull. `fill` makes the content taller than the scroll viewport (the
// header is always ≥ 4.75rem, so this clears it) so the native pull-to-bounce always has
// somewhere to go — the daylight ground shows through the overscroll. Taller content
// just scrolls normally. Intended for `header` screens.
const FILL = 'min-h-[calc(100dvh_-_3.5rem)]'

/** The phone-first screen column: centered, capped at the app width, safe-area aware.
 * The shell itself is fixed-height and never scrolls, so the inner `<main>` is the
 * per-screen scroll container — only it scrolls, over the fixed daylight ground. Pass
 * `scrollRef` to track its scroll offset (e.g. for a collapsible header).
 *
 * Pass `header` to pin a header above the scroll container: it becomes a sibling of
 * `<main>`, not a child, so the content can scroll and bounce under it while the header
 * stays put. The header owns the top safe-area inset, so `<main>` needs no `pt-safe`.
 *
 * Every route mounts a fresh scroller, so the scroll always starts at the top — the
 * layout effect guarantees it even if the browser or scroll-restoration tries to carry
 * a position across the navigation. Pass `fill` on short screens so the native
 * pull-to-bounce always has room to overscroll. */
export function AppScreen({
  children,
  className,
  scrollRef,
  header,
  fill,
}: {
  children?: ReactNode
  className?: string
  scrollRef?: (node: HTMLElement | null) => void
  header?: ReactNode
  fill?: boolean
}) {
  const innerRef = useRef<HTMLElement | null>(null)

  // Merge the internal ref (for the scroll reset) with the optional forwarded one.
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      innerRef.current = node
      scrollRef?.(node)
    },
    [scrollRef],
  )

  // Open at the top, always. Runs before paint so the user never sees a flash of a
  // carried-over scroll position when arriving from a scrolled screen. Direct property
  // assignment (not `scrollTo`) so it's a no-op rather than a throw under jsdom.
  useLayoutEffect(() => {
    const node = innerRef.current
    if (node) {
      node.scrollTop = 0
      node.scrollLeft = 0
    }
  }, [])

  const content = fill ? <div className={FILL}>{children}</div> : children

  if (!header) {
    return (
      <main
        ref={setRef}
        className={cn('mx-auto flex h-full w-full max-w-[430px] flex-col', SCROLL, className)}
      >
        {content}
      </main>
    )
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[430px] flex-col">
      {header}
      <main ref={setRef} className={cn('min-h-0 flex-1', SCROLL, className)}>
        {content}
      </main>
    </div>
  )
}
