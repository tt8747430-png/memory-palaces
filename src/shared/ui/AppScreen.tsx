import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react'
import {
  cn,
  HeaderElevationContext,
  SCREEN_SCROLL,
  ScreenScrollContext,
  useBottomChrome,
  useKeyboardOpen,
  useKeyboardReveal,
  useStickyHeader,
} from '@/shared/lib'

const SCROLL = `${SCREEN_SCROLL} flex flex-col px-5`

const SCROLL_SAFE = 'pb-safe'

const SCROLL_KEYBOARD = 'pb-keyboard'

const FILL = 'min-h-[calc(100%-var(--screen-gutter,0px))] shrink-0'

const BOUNCE = 'min-h-[calc(100%+1px-var(--screen-gutter,0px))] shrink-0'

/**
 * Pinned: a flex item of the shell, beside the scroll body rather than inside it. It takes real
 * layout space, so the body shrinks to fit above it and scrolls alone — the footer cannot lift at
 * the end of a scroll, drift on the first paint of real content, or need a measured spacer, because
 * it was never in the scroll's coordinate space to begin with.
 */
const FOOTER_PINNED = 'shrink-0'

/**
 * In flow: the last thing in the scroll body, reached by scrolling to it. This is where the footer
 * goes while the keyboard is up, because the pinned position is behind the keyboard and a CTA the
 * learner cannot reach mid-answer is a CTA they must dismiss the keyboard to press
 * ([CODE_STYLE §11](../../docs/CODE_STYLE.md)). `-mx-5` cancels the body's own gutter; the pinned
 * position is outside it and needs no such thing.
 */
const FOOTER_IN_FLOW = '-mx-5 mt-auto shrink-0'

const SHELL = 'h-full'

export type ScreenGutter = 'end' | 'dial'

const GUTTER: Record<ScreenGutter, string> = {
  end: '[--screen-gutter:calc(var(--app-bottom-inset)+5rem)]',
  dial: '[--screen-gutter:calc(var(--app-bottom-inset)+8.5rem)]',
}

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
  pinned?: ReactNode
  footer?: ReactNode
  gutter?: ScreenGutter
  fill?: boolean
  bounce?: boolean
}) {
  const innerRef = useRef<HTMLElement | null>(null)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  const { ref: measureScroll, elevation } = useStickyHeader()
  const revealScroll = useKeyboardReveal()
  const claimChrome = useBottomChrome()
  const keyboard = useKeyboardOpen()

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      innerRef.current = node
      setScrollElement(node)
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

  const sizer = footer ? 'flex-1' : bounce ? BOUNCE : fill || gutter ? FILL : null
  const content = sizer ? <div className={sizer}>{children}</div> : children
  const scrollInset = footer || gutter ? SCROLL_KEYBOARD : SCROLL_SAFE
  const gutterScale = gutter ? cn(GUTTER[gutter], GUTTER_KEYBOARD) : null
  const gutterBox = gutter ? <div aria-hidden className={GUTTER_BOX} /> : null

  // One box, two places. Which one it is in is the only thing the keyboard decides here; nothing
  // compensates for the pan, and nothing is positioned from a live measurement (ADR 0002).
  const footerBox = footer ? (
    <div ref={claimChrome} className={keyboard ? FOOTER_IN_FLOW : FOOTER_PINNED}>
      {footer}
    </div>
  ) : null

  if (!header && !footer && !pinned) {
    return (
      <ScreenScrollContext value={scrollElement}>
        <main
          ref={setRef}
          data-screen-scroll
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
      </ScreenScrollContext>
    )
  }

  return (
    <ScreenScrollContext value={scrollElement}>
      <HeaderElevationContext value={elevation}>
        <div className={cn('mx-auto flex w-full max-w-app flex-col', SHELL)}>
          {header}
          {pinned ? <div className="shrink-0">{pinned}</div> : null}
          <main
            ref={setRef}
            data-screen-scroll
            className={cn('min-h-0 flex-1', SCROLL, scrollInset, gutterScale, className)}
          >
            {content}
            {gutterBox}
            {keyboard ? footerBox : null}
          </main>
          {keyboard ? null : footerBox}
        </div>
      </HeaderElevationContext>
    </ScreenScrollContext>
  )
}
