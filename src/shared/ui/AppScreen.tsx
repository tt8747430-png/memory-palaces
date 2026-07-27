import { type ReactNode, useCallback, useLayoutEffect, useRef } from 'react'
import { cn, HeaderElevationContext, useKeyboardReveal, useStickyHeader } from '@/shared/lib'

const SCROLL = 'overflow-y-auto overscroll-contain scrollbar-hide px-5'

const SCROLL_SAFE = 'pb-safe'

const SCROLL_KEYBOARD = 'pb-keyboard'

const FILL = 'min-h-full'

const FOOTER_DOCK = '-mx-5 mt-auto shrink-0'

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
        className={cn(
          'mx-auto flex w-full max-w-[430px] flex-col',
          SHELL,
          SCROLL,
          SCROLL_SAFE,
          className,
        )}
      >
        {content}
      </main>
    )
  }

  return (
    <HeaderElevationContext value={elevation}>
      <div className={cn('mx-auto flex w-full max-w-[430px] flex-col', SHELL)}>
        {header}
        <main
          ref={setRef}
          className={cn(
            'min-h-0 flex-1',
            SCROLL,
            footer ? `flex flex-col ${SCROLL_KEYBOARD}` : SCROLL_SAFE,
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
