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

/**
 * `shrink-0` on both sizers, and it is load-bearing. A flex item's `min-height: auto` is what
 * normally stops it shrinking below its own content; writing any other `min-height` — which is
 * exactly what these two do — throws that floor away, and the item becomes free to compress to the
 * value written here while its content overflows a box the scroller never measured. The scroll
 * range then describes the port, not the list.
 *
 * Both subtract the gutter, and that is what keeps a short screen still. The gutter box is real
 * height at the end of the content: a body sized to the whole port plus a gutter under it is a
 * screen that scrolls by the gutter's height with nothing to show for it — every row already
 * visible, the list sliding under the finger anyway. Sized to the port *minus* the gutter, body and
 * gutter together come to exactly one port and a screen that fits has no range at all.
 */
const FILL = 'min-h-[calc(100%-var(--screen-gutter,0px))] shrink-0'

/**
 * A scrollport with nothing to scroll does not rubber-band — iOS bounces a box that has range, and
 * a short library has none, so the whole screen reads as a dead slab under the finger. One pixel
 * past the port is range: invisible, unreachable by a real gesture, and enough to keep the bounce.
 *
 * Only meaningful without a footer dock — with one the body is already `flex-1` and the dock rests
 * at the end of the scroll, so the screen is never shorter than its port.
 */
const BOUNCE = 'min-h-[calc(100%+1px-var(--screen-gutter,0px))] shrink-0'

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
 * clear of it. `dial` also clears `SelectToolbarDock` on the two screens that carry both — a
 * change to the dock's height is a change to this value.
 *
 * Declared as a variable on the scroller rather than a height on the box, because the sizer above
 * has to subtract the same number and the two must not drift.
 */
export type ScreenGutter = 'end' | 'dial'

const GUTTER: Record<ScreenGutter, string> = {
  end: '[--screen-gutter:calc(var(--app-bottom-inset)+5rem)]',
  dial: '[--screen-gutter:calc(var(--app-bottom-inset)+8.5rem)]',
}

/**
 * There is nothing left to clear while the keyboard is up: the nav is hidden, the dial and the
 * select dock with it, and the footer has gone `static` (CODE_STYLE §11). Keeping the gutter would
 * hand the scroll body the keyboard's own range *plus* room for chrome that is off the screen, and
 * a revealed field would ride that far past the keyboard's edge.
 */
const GUTTER_KEYBOARD = 'in-data-keyboard:[--screen-gutter:0px]'

const GUTTER_BOX = 'h-(--screen-gutter) shrink-0'

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

  /**
   * `flex-1` first, and for any dock rather than only a filled one: it is the sizer that leaves
   * room for a box whose height nothing here knows. `min-height` can subtract the gutter because
   * the gutter is written down; the dock's height is whatever the screen put in it, so the only
   * sizer that can account for it is the one that takes what is left.
   *
   * A gutter implies a sizer even where the screen asked for neither: without one the body is its
   * content's own height and the gutter box is pure scroll range under a screen that fits.
   */
  const sizer = footer ? 'flex-1' : bounce ? BOUNCE : fill || gutter ? FILL : null
  const content = sizer ? <div className={sizer}>{children}</div> : children
  // The gutter's own height already carries the scroll past the home indicator, so `pb-safe` under
  // it would only add dead range below the last row.
  const scrollInset = footer || gutter ? SCROLL_KEYBOARD : SCROLL_SAFE
  const gutterScale = gutter ? cn(GUTTER[gutter], GUTTER_KEYBOARD) : null
  const gutterBox = gutter ? <div aria-hidden className={GUTTER_BOX} /> : null

  if (!header && !footer && !pinned) {
    return (
      <main
        ref={setRef}
        className={cn(
          'mx-auto w-full max-w-app',
          SHELL,
          SCROLL,
          scrollInset,
          gutterScale,
          className,
        )}
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
        <main
          ref={setRef}
          className={cn('min-h-0 flex-1', SCROLL, scrollInset, gutterScale, className)}
        >
          {content}
          {gutterBox}
          {footer ? <div className={FOOTER_DOCK}>{footer}</div> : null}
        </main>
      </div>
    </HeaderElevationContext>
  )
}
