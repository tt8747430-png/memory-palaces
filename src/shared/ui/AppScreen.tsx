import { type ReactNode, useCallback, useLayoutEffect, useRef } from 'react'
import { cn, HeaderElevationContext, useStickyHeader } from '@/shared/lib'

const SCROLL = 'overflow-y-auto overscroll-contain scrollbar-hide px-5'

// A screen with no footer has to clear the home indicator with its own last row; one with a footer
// leaves that to the bar, which is docked below the scroller — padding both only buys dead scroll.
const SCROLL_SAFE = 'pb-safe'

// Fills the shell (which itself fits above the keyboard via `--vvh`), not the raw screen, so a
// short page still fills the view without adding scroll past the keyboard.
const FILL = 'min-h-full'

// The shell fits the visible viewport: when the keyboard opens it shrinks to the space above it
// (header/footer stay pinned, `<main>` scrolls), exactly like native `resizes-content`. `--vvh`
// defaults to full height, so with no keyboard the shell fills the screen as before.
const SHELL = 'h-[var(--vvh)]'

export function AppScreen({
  children,
  className,
  scrollRef,
  header,
  footer,
  fill,
}: {
  children?: ReactNode
  className?: string
  scrollRef?: (node: HTMLElement | null) => void
  header?: ReactNode
  footer?: ReactNode
  fill?: boolean
}) {
  const innerRef = useRef<HTMLElement | null>(null)
  // The screen owns its scroller, so it also owns how lifted the header looks. `HeaderBar` reads
  // this through context — no page has to hand a ref from its header to its body.
  const { ref: measureScroll, elevation } = useStickyHeader()

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      innerRef.current = node
      measureScroll(node)
      scrollRef?.(node)
    },
    [measureScroll, scrollRef],
  )

  useLayoutEffect(() => {
    const node = innerRef.current
    if (node) {
      node.scrollTop = 0
      node.scrollLeft = 0
    }
  }, [])

  const content = fill ? <div className={FILL}>{children}</div> : children

  if (!header && !footer) {
    return (
      <main
        ref={setRef}
        className={cn(
          'mx-auto flex w-full max-w-[430px] flex-col',
          SHELL,
          SCROLL,
          SCROLL_SAFE,
          className,
        )}
      >
        {content}
      </main>
    )
  }

  return (
    <HeaderElevationContext value={elevation}>
      <div className={cn('mx-auto flex w-full max-w-[430px] flex-col', SHELL)}>
        {header}
        <main
          ref={setRef}
          className={cn('min-h-0 flex-1', SCROLL, footer ? undefined : SCROLL_SAFE, className)}
        >
          {content}
        </main>
        {footer}
      </div>
    </HeaderElevationContext>
  )
}
