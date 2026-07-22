import { type ReactNode, useCallback, useLayoutEffect, useRef } from 'react'
import { cn } from '@/shared/lib'

const SCROLL = 'overflow-y-auto overscroll-contain scrollbar-hide px-5 pb-safe'

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

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      innerRef.current = node
      scrollRef?.(node)
    },
    [scrollRef],
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
        className={cn('mx-auto flex w-full max-w-[430px] flex-col', SHELL, SCROLL, className)}
      >
        {content}
      </main>
    )
  }

  return (
    <div className={cn('mx-auto flex w-full max-w-[430px] flex-col', SHELL)}>
      {header}
      <main ref={setRef} className={cn('min-h-0 flex-1', SCROLL, className)}>
        {content}
      </main>
      {footer}
    </div>
  )
}
