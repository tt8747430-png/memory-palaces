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

/**
 * A scrollport with nothing to scroll does not rubber-band — iOS bounces a box that has range, and
 * a short library has none, so the whole screen reads as a dead slab under the finger. One pixel
 * past the port is range: invisible, unreachable by a real gesture, and enough to keep the bounce.
 *
 * Only meaningful without a footer dock — with one the body is already `flex-1` and the dock rests
 * at the end of the scroll, so the screen is never shorter than its port.
 */
const BOUNCE = 'min-h-[calc(100%+1px)]'

const FOOTER_DOCK = 'sticky bottom-0 z-10 -mx-5 mt-auto shrink-0 [[data-keyboard]_&]:static'

const SHELL = 'h-full'

export function AppScreen({
  children,
  className,
  scrollRef,
  header,
  footer,
  fill,
  bounce,
}: {
  children?: ReactNode
  className?: string
  scrollRef?: (node: HTMLElement | null) => void
  header?: ReactNode
  footer?: ReactNode
  fill?: boolean
  /** Keep the scroll gesture alive even when the screen is shorter than the port. See `BOUNCE`. */
  bounce?: boolean
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

  // `flex-1` first: a dock has to be pushed to the end before anything asks for extra range.
  const sizer = fill && footer ? 'flex-1' : bounce ? BOUNCE : fill ? FILL : null
  const content = sizer ? <div className={sizer}>{children}</div> : children

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
