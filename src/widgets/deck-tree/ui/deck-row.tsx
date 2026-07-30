import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { type Deck, DEFAULT_DECK_ICON } from '@/entities/deck'
import { cn, type SelectState } from '@/shared/lib'
import { DeckCover, SelectDot } from '@/shared/ui'
import { DECK_ROW_FRAME, deckColor } from './row-style'

export interface DeckRowBodyProps {
  deck: Deck
  due: number
  isSub?: boolean
  selectState?: SelectState
  toggle?: ReactNode
}

export function DeckRowBody({ deck, due, isSub = false, selectState, toggle }: DeckRowBodyProps) {
  const { t } = useTranslation()
  const selectMode = selectState !== undefined

  return (
    <>
      {selectMode ? (
        <span className="pointer-events-none relative z-20 grid size-6 shrink-0 place-items-center">
          <SelectDot state={selectState} />
        </span>
      ) : null}

      {toggle}

      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3">
        <span className="relative shrink-0">
          <DeckCover
            icon={deck.icon || DEFAULT_DECK_ICON}
            color={deckColor(deck)}
            className={cn(
              'rounded-2xl shadow-rest ring-1 ring-black/5',
              isSub ? 'size-8' : 'size-9',
            )}
            iconClassName={isSub ? 'text-[0.9rem] leading-none' : 'text-base leading-none'}
          />
          {due > 0 ? (
            <span
              className="absolute -right-1.5 -top-1.5 grid h-4.5
             min-w-4.5 place-items-center rounded-full bg-primary px-1 text-(length:--p-text-tiny) font-bold tabular-nums text-primary-foreground shadow-interactive ring-2 ring-card"
              aria-hidden
            >
              {due > 99 ? '99+' : due}
            </span>
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate font-semibold text-heading',
              isSub ? 'text-(length:--p-text-sub)' : 'text-(length:--p-text-body)',
            )}
          >
            {deck.name}
          </span>
          <span
            className={cn(
              'block truncate ' +
              'text-(length:--p-text-label)',
              due > 0 ? 'font-medium text-primary/80' : 'text-muted-foreground',
            )}
          >
            {due > 0 ? t('deck.dueToday', { count: due }) : t('deck.noCards')}
          </span>
        </span>

        {selectMode ? null : (
          <ChevronRight className="size-5 shrink-0 text-muted-foreground/70" aria-hidden />
        )}
      </div>
    </>
  )
}

export function DeckDragPreview({
  deck,
  due,
  selected,
}: {
  deck: Deck
  due: number
  selected: boolean
}) {
  return (
    <div
      className={cn(
        DECK_ROW_FRAME,
        'bg-card shadow-elevated ring-1',
        selected ? 'ring-2 ring-accent' : 'ring-border/60',
      )}
    >
      <DeckRowBody deck={deck} due={due} selectState={selected ? 'checked' : 'unchecked'} />
    </div>
  )
}
