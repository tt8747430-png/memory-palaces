import { type ReactNode, useCallback, useLayoutEffect, useRef } from 'react'
import {
  cn,
  HeaderElevationContext,
  SCREEN_SCROLL,
  useBottomChrome,
  useKeyboardReveal,
  useStickyHeader,
} from '@/shared/lib'

const SCROLL = `${SCREEN_SCROLL} flex flex-col px-5`

const SCROLL_SAFE = 'pb-safe'

const SCROLL_KEYBOARD = 'pb-keyboard'

const FILL = 'min-h-[calc(100%-var(--screen-gutter,0px))] shrink-0'

const BOUNCE = 'min-h-[calc(100%+1px-var(--screen-gutter,0px))] shrink-0'

const FOOTER_DOCK = 'sticky bottom-0 z-(--z-raised) -mx-5 mt-auto shrink-0 in-data-keyboard:static'

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
  const { ref: measureScroll, elevation } = useStickyHeader()
  const revealScroll = useKeyboardReveal()
  const claimChrome = useBottomChrome()

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

  const sizer = footer ? 'flex-1' : bounce ? BOUNCE : fill || gutter ? FILL : null
  const content = sizer ? <div className={sizer}>{children}</div> : children
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
          {footer ? (
            <div ref={claimChrome} className={FOOTER_DOCK}>
              {footer}
            </div>
          ) : null}
        </main>
      </div>
    </HeaderElevationContext>
  )
}
