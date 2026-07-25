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
  /** Nested rows read a shade smaller. Only the browse tree nests; select mode is flat. */
  isSub?: boolean
  /** The select checkbox's state, or `undefined` when the row is not in select mode. */
  selectState?: SelectState
  /** The expand control — interactive in the tree, absent everywhere else. */
  toggle?: ReactNode
}

/** Everything inside a deck row: select dot, expand toggle, cover, name, due. */
export function DeckRowBody({ deck, due, isSub = false, selectState, toggle }: DeckRowBodyProps) {
  const { t } = useTranslation()
  const selectMode = selectState !== undefined

  return (
    <>
      {/* The checkbox sits alongside the expand toggle, so a deck can still be
          expanded while it is selected. */}
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
              className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[length:var(--p-text-tiny)] font-bold tabular-nums text-primary-foreground shadow-interactive ring-2 ring-card"
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
              isSub ? 'text-[length:var(--p-text-sub)]' : 'text-[length:var(--p-text-body)]',
            )}
          >
            {deck.name}
          </span>
          <span
            className={cn(
              'block truncate text-[length:var(--p-text-label)]',
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

/**
 * The deck in hand. It is the row, one elevation up: same frame, same body, same select dot — so
 * when it is dropped it settles onto the real row instead of cross-fading into a different shape.
 * The lift is carried by shadow alone; a scaled overlay pops at the end of the drop.
 */
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
