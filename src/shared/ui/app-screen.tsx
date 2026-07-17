import { type ReactNode, useCallback, useLayoutEffect, useRef } from 'react'
import { cn } from '@/shared/lib'

const SCROLL =
  'overflow-y-auto overscroll-contain scrollbar-hide px-5 ' +
  'pb-[max(env(safe-area-inset-bottom),var(--kb-inset,0px))] ' +
  'scroll-pb-[var(--kb-inset,0px)]'

const FILL = 'min-h-[calc(100dvh_-_3.5rem)]'

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

  // The shell fills its parent; it never shrinks for the on-screen keyboard. Only sheets lift
  // over the keyboard — a full page stays put and gains scroll capacity equal to `--kb-inset`
  // so controls under the keyboard are reached by scrolling, not by the page shrinking.
  if (!header && !footer) {
    return (
      <main
        ref={setRef}
        className={cn('mx-auto flex h-full w-full max-w-[26.875rem] flex-col', SCROLL, className)}
      >
        {content}
      </main>
    )
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[26.875rem] flex-col">
      {header}
      <main ref={setRef} className={cn('min-h-0 flex-1', SCROLL, className)}>
        {content}
      </main>
      {footer}
    </div>
  )
}
