import { type ReactNode, useCallback, useLayoutEffect, useRef } from 'react'
import { cn } from '@/shared/lib'

const SCROLL = 'overflow-y-auto overscroll-contain scrollbar-hide px-5 pb-safe'

const FILL = 'min-h-[calc(100dvh_-_3.5rem)]'

export function AppScreen({
  children,
  className,
  scrollRef,
  header,
  footer,
  fill,
  keyboard,
}: {
  children?: ReactNode
  className?: string
  scrollRef?: (node: HTMLElement | null) => void
  header?: ReactNode
  footer?: ReactNode
  fill?: boolean
  /**
   * Full-page editors set this so the screen shrinks to sit above the on-screen
   * keyboard (the action bar stays reachable). Overlay-host pages leave it off —
   * their sheets lift themselves, and the page behind must not move.
   */
  keyboard?: boolean
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

  // In keyboard mode the shell shrinks to sit above the keyboard (`.kb-fit`);
  // otherwise it fills its parent. `.kb-fit` is a no-op when `--kb` is 0 and
  // steps aside while a sheet overlay is open (see `useOverlayLock`).
  const fit = keyboard ? 'kb-fit' : 'h-full'

  if (!header && !footer) {
    return (
      <main
        ref={setRef}
        className={cn('mx-auto flex w-full max-w-[430px] flex-col', fit, SCROLL, className)}
      >
        {content}
      </main>
    )
  }

  return (
    <div className={cn('mx-auto flex w-full max-w-[430px] flex-col', fit)}>
      {header}
      <main ref={setRef} className={cn('min-h-0 flex-1', SCROLL, className)}>
        {content}
      </main>
      {footer}
    </div>
  )
}
