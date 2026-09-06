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

/**
 * With a dock — or with a `gutter`, whose own height already carries the scroll past the home
 * indicator — that box owns the bottom inset, so only the keyboard's range is added.
 */
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

const FOOTER_DOCK = 'sticky bottom-0 z-(--z-raised) -mx-5 mt-auto shrink-0 in-data-keyboard:static'

const SHELL = 'h-full'

/**
 * The room the chrome floating over this screen needs at the end of the scroll, so the last row
 * comes to rest above the nav and the dial instead of underneath them.
 *
 * An empty box at the end of the content, not padding on the scroller and not a margin under it.
 * Padding is unreliable — engines disagree about whether a scrolling flex column's end padding
 * belongs to its scrollable overflow, and WebKit drops it, which is why `pb-dial` left no clearance
 * at all on the phone. A margin would work, but it shortens the port: the list would then be cut
 * off partway up the screen instead of running to the display edge, and rows would stop passing
 * behind the nav's glass on the way by.
 *
 * Two values, because there are two questions and `--app-bottom-inset` has already answered the
 * first: `AppNav` writes its own height into that variable on the routes it shows on, so a
 * screen never has to say whether the nav is there. A third `nav` gutter used to, at
 * `inset + 4.5rem` against `end`'s `inset + 5rem` — half a rem apart, and worn by six screens the
 * nav does not appear on at all. It said nothing `end` did not.
 *
 * `end` is the resting case: nothing floats over the scroll but the nav, and the last row simply
 * wants somewhere to come to rest. `dial` is the one that grew — the dial's 3.5rem button floats
 * 1rem above `--app-bottom-inset` and so reaches 4.5rem up, and the last row rests a further 4rem
 * clear of it. `dial` also clears the select-mode toolbar dock, which stands about 7.75rem tall on
 * the two screens that carry both.
 */
export type ScreenGutter = 'end' | 'dial'

const GUTTER: Record<ScreenGutter, string> = {
  end: 'h-[calc(var(--app-bottom-inset)+5rem)]',
  dial: 'h-[calc(var(--app-bottom-inset)+8.5rem)]',
}

export function AppScreen({
  children,
  className,
  scrollRef,
  header,
  pinned,
  footer,
  gutter,
  fill,
  bounce,
}: {
  children?: ReactNode
  className?: string
  scrollRef?: (node: HTMLElement | null) => void
  header?: ReactNode
  /**
   * A band under the header that stays put while the body scrolls — a live preview of what the
   * controls below are editing. Outside the scroller and outside its gutter, so it can bleed to
   * both edges.
   */
  pinned?: ReactNode
  footer?: ReactNode
  /** Space kept clear at the end of the scroll for chrome floating over it. See `GUTTER`. */
  gutter?: ScreenGutter
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
  // The gutter's own height already carries the scroll past the home indicator, so `pb-safe` under
  // it would only add dead range below the last row.
  const scrollInset = footer || gutter ? SCROLL_KEYBOARD : SCROLL_SAFE
  const gutterBox = gutter ? <div aria-hidden className={cn('shrink-0', GUTTER[gutter])} /> : null

  if (!header && !footer && !pinned) {
    return (
      <main
        ref={setRef}
        className={cn('mx-auto w-full max-w-app', SHELL, SCROLL, scrollInset, className)}
      >
        {content}
        {gutterBox}
      </main>
    )
  }

  return (
    <HeaderElevationContext value={elevation}>
      <div className={cn('mx-auto flex w-full max-w-app flex-col', SHELL)}>
        {header}
        {pinned ? <div className="shrink-0">{pinned}</div> : null}
        <main ref={setRef} className={cn('min-h-0 flex-1', SCROLL, scrollInset, className)}>
          {content}
          {gutterBox}
          {footer ? <div className={FOOTER_DOCK}>{footer}</div> : null}
        </main>
      </div>
    </HeaderElevationContext>
  )
}
