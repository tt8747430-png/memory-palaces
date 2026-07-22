import { type ReactNode, useCallback, useLayoutEffect, useRef } from 'react'
import { cn } from '@/shared/lib'
import { KeyboardSpacer } from './KeyboardSpacer'

const SCROLL = 'overflow-y-auto overscroll-contain scrollbar-hide px-5 pb-safe scroll-pb-kb'

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

  // The shell never shrinks for the keyboard. Instead the scroll surface gains a `KeyboardSpacer`
  // of slack at its foot so its lower rows can be scrolled up clear of the keyboard (the pinned
  // header stays put), matching the app-wide keyboard model.
  if (!header && !footer) {
    return (
      <main
        ref={setRef}
        className={cn('mx-auto flex h-full w-full max-w-[430px] flex-col', SCROLL, className)}
      >
        {content}
        <KeyboardSpacer />
      </main>
    )
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[430px] flex-col">
      {header}
      <main ref={setRef} className={cn('min-h-0 flex-1', SCROLL, className)}>
        {content}
        <KeyboardSpacer />
      </main>
      {footer}
    </div>
  )
}
