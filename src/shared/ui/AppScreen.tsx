import { type ReactNode, useCallback, useLayoutEffect, useRef } from 'react'
import {
  cn,
  HeaderElevationContext,
  SCREEN_SCROLL,
  useKeyboardReveal,
  useStickyHeader,
} from '@/shared/lib'

const SCROLL = `${SCREEN_SCROLL} flex flex-col px-5`

/** No dock: the scroll body owns the bottom gutter, and the keyboard's range when it is up. */
const SCROLL_SAFE = 'pb-safe'

/** With a dock: `FooterBar` carries the gutter itself, so only the keyboard's range is added. */
const SCROLL_KEYBOARD = 'pb-keyboard'

const FILL = 'min-h-full'

const FOOTER_DOCK = 'sticky bottom-0 z-10 -mx-5 mt-auto shrink-0 [[data-keyboard]_&]:static'

const SHELL = 'h-full'

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
  const { ref: measureScroll, elevation } = useStickyHeader()
  const revealScroll = useKeyboardReveal()

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      innerRef.current = node
      measureScroll(node)
      revealScroll(node)
      scrollRef?.(node)
    },
    [measureScroll, revealScroll, scrollRef],
  )

  useLayoutEffect(() => {
    const node = innerRef.current
    if (node) {
      node.scrollTop = 0
      node.scrollLeft = 0
    }
  }, [])

  const content = fill ? <div className={footer ? 'flex-1' : FILL}>{children}</div> : children

  if (!header && !footer) {
    return (
      <main
        ref={setRef}
        className={cn('mx-auto w-full max-w-app', SHELL, SCROLL, SCROLL_SAFE, className)}
      >
        {content}
      </main>
    )
  }

  return (
    <HeaderElevationContext value={elevation}>
      <div className={cn('mx-auto flex w-full max-w-app flex-col', SHELL)}>
        {header}
        <main
          ref={setRef}
          className={cn(
            'min-h-0 flex-1',
            SCROLL,
            footer ? SCROLL_KEYBOARD : SCROLL_SAFE,
            className,
          )}
        >
          {content}
          {footer ? <div className={FOOTER_DOCK}>{footer}</div> : null}
        </main>
      </div>
    </HeaderElevationContext>
  )
}
