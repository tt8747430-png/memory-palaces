import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Card } from '@/entities/card'
import { cn } from '@/shared/lib'

export interface CardFilmstripProps {
  cards: Card[]
  index: number
  reduce: boolean
  onPick: (index: number) => void
}

/** Half the active thumbnail (w-12), so the first and last card can reach the centre. */
const EDGE_SPACER = 'w-[calc(50%-1.5rem)] shrink-0'

/**
 * The card equivalent of the Photos filmstrip: every card in the browser as a
 * thumbnail, the current one grown and centred. Tapping one jumps straight to
 * it, so a long deck no longer needs a run of Next taps.
 */
export function CardFilmstrip({ cards, index, reduce, onPick }: CardFilmstripProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const active = ref.current?.querySelector<HTMLElement>(`[data-strip-index="${index}"]`)
    if (typeof active?.scrollIntoView !== 'function') return
    active.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: reduce ? 'auto' : 'smooth',
    })
  }, [index, reduce])

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={t('cards.browser.filmstrip')}
      aria-orientation="horizontal"
      className="-m-1.5 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain p-1.5 scrollbar-hide"
    >
      <span aria-hidden className={EDGE_SPACER} />
      {cards.map((card, at) => {
        const active = at === index
        return (
          <button
            key={card.id}
            type="button"
            role="tab"
            data-strip-index={at}
            aria-selected={active}
            aria-label={t('cards.browser.goTo', { position: at + 1, total: cards.length })}
            onClick={() => onPick(at)}
            className={cn(
              'h-14 w-12 shrink-0 origin-center overflow-hidden rounded-control border bg-card px-1 py-1 text-left',
              'transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none',
              active
                ? 'border-transparent opacity-100 ring-2 ring-primary'
                : 'scale-[0.78] border-border opacity-60',
            )}
          >
            <span
              aria-hidden
              className="line-clamp-4 break-words text-tiny leading-tight text-heading"
            >
              {card.front}
            </span>
          </button>
        )
      })}
      <span aria-hidden className={EDGE_SPACER} />
    </div>
  )
}
