import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Deck } from '@/entities/deck'
import type { Card } from '@/entities/card'
import type { SwipeConfig } from '@/shared/config/swipe'
import { cn, dueCountsPerDeck, type FlatDeck, useLongPress } from '@/shared/lib'
import { buildSwipeActions, type SwipeActionHandlers, SwipeRow } from '@/shared/ui'
import { DeckRowBody } from './deck-row'
import { DECK_ROW_FRAME, TOGGLE_BASE, toggleFrame, toggleSurface } from './row-style'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

const TREE_INDENT = 22

export interface DeckTreeProps {
  rows: FlatDeck[]
  decks: Deck[]
  cards: Card[]
  expanded: ReadonlySet<string>
  onToggle: (deckId: string) => void
  onOpen: (deckId: string) => void
  onRequestSelect: (deckId: string) => void
  swipe?: SwipeConfig
  swipeHandlers?: (deck: Deck) => SwipeActionHandlers
  now?: number
}

export function DeckTree({
  rows,
  decks,
  cards,
  expanded,
  onToggle,
  onOpen,
  onRequestSelect,
  swipe,
  swipeHandlers,
  now = Date.now(),
}: DeckTreeProps) {
  const dueCounts = useMemo(() => dueCountsPerDeck(decks, cards, now), [decks, cards, now])
  const byId = useMemo(() => new Map(decks.map((d) => [d.id, d])), [decks])

  return (
    <ul className="relative flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {rows.map((row) => {
          const deck = byId.get(row.id)
          if (!deck) return null
          return (
            <DeckTreeRow
              key={row.id}
              row={row}
              deck={deck}
              due={dueCounts.get(row.id) ?? 0}
              isOpen={expanded.has(row.id)}
              onToggle={onToggle}
              onOpen={onOpen}
              onRequestSelect={onRequestSelect}
              swipe={swipe}
              swipeHandlers={swipeHandlers}
            />
          )
        })}
      </AnimatePresence>
    </ul>
  )
}

interface DeckTreeRowProps {
  row: FlatDeck
  deck: Deck
  due: number
  isOpen: boolean
  onToggle: (deckId: string) => void
  onOpen: (deckId: string) => void
  onRequestSelect: (deckId: string) => void
  swipe?: SwipeConfig
  swipeHandlers?: (deck: Deck) => SwipeActionHandlers
}

function DeckTreeRow({
  row,
  deck,
  due,
  isOpen,
  onToggle,
  onOpen,
  onRequestSelect,
  swipe,
  swipeHandlers,
}: DeckTreeRowProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const isSub = row.depth > 0

  const longPress = useLongPress({
    onLongPress: () => onRequestSelect(deck.id),
    onTap: () => onOpen(deck.id),
  })

  const { leading, trailing } =
    swipe && swipeHandlers
      ? buildSwipeActions(swipe, swipeHandlers(deck), t)
      : { leading: [], trailing: [] }
  const swipeEnabled = leading.length > 0 || trailing.length > 0

  const inner = (
    <div className={cn(DECK_ROW_FRAME, 'relative bg-card shadow-card transition-shadow')}>
      <button
        type="button"
        {...longPress}
        aria-label={t('deck.rowOpen', { name: deck.name })}
        className="absolute inset-0 rounded-card transition-colors active:bg-primary/[0.06]"
      />

      <DeckRowBody
        deck={deck}
        due={due}
        isSub={isSub}
        toggle={
          row.hasChildren ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.8 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onToggle(deck.id)
              }}
              aria-label={isOpen ? t('deck.collapse') : t('deck.expand')}
              aria-expanded={isOpen}
              className={cn(
                TOGGLE_BASE,
                'relative z-20 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
                toggleFrame(isSub),
                toggleSurface(isOpen),
              )}
            >
              {isOpen ? (
                <Minus className={isSub ? 'size-3.5' : 'size-4'} aria-hidden />
              ) : (
                <Plus className={isSub ? 'size-3.5' : 'size-4'} aria-hidden />
              )}
            </motion.button>
          ) : (
            <span className={cn('relative z-10 shrink-0', toggleFrame(isSub))} aria-hidden />
          )
        }
      />

      {isSub ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-2 left-[-11px] w-[2px] rounded-full bg-primary/[0.12]"
        />
      ) : null}
    </div>
  )

  return (
    <motion.li
      style={{ paddingLeft: row.depth * TREE_INDENT }}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: EASE_OUT }}
      className="relative"
    >
      {swipeEnabled ? (
        <SwipeRow leading={leading} trailing={trailing} bleed>
          {inner}
        </SwipeRow>
      ) : (
        inner
      )}
    </motion.li>
  )
}
