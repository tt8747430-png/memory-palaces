import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Minus, Plus } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  type Deck,
  DECK_COLOR_OPTIONS,
  DEFAULT_DECK_COLOR,
  DEFAULT_DECK_ICON,
} from '@/entities/deck'
import type { Card } from '@/entities/card'
import type { SwipeConfig } from '@/shared/config/swipe'
import { childDecks, cn, dueCountsPerDeck, useLongPress } from '@/shared/lib'
import {
  ActionSheet,
  buildSwipeActions,
  DeckCover,
  type SheetAction,
  type SwipeActionHandlers,
  SwipeRow,
} from '@/shared/ui'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

function deckColor(deck: Deck): string {
  if (deck.color) return deck.color
  let hash = 0
  for (let i = 0; i < deck.id.length; i++) hash = (hash * 31 + deck.id.charCodeAt(i)) | 0
  return DECK_COLOR_OPTIONS[Math.abs(hash) % DECK_COLOR_OPTIONS.length]?.value ?? DEFAULT_DECK_COLOR
}

export interface DeckTreeProps {
  decks: Deck[]
  cards: Card[]
  expanded: ReadonlySet<string>
  onToggle: (deckId: string) => void
  onOpen: (deckId: string) => void
  deckActions?: (deck: Deck) => SheetAction[]
  swipe?: SwipeConfig
  swipeHandlers?: (deck: Deck) => SwipeActionHandlers
  parentId?: string | null
  folderId?: string | null
  now?: number
}

export function DeckTree({
  decks,
  cards,
  expanded,
  onToggle,
  onOpen,
  deckActions,
  swipe,
  swipeHandlers,
  parentId = null,
  folderId = null,
  now = Date.now(),
}: DeckTreeProps) {
  const dueCounts = useMemo(() => dueCountsPerDeck(decks, cards, now), [decks, cards, now])
  const roots = useMemo(
    () =>
      childDecks(decks, parentId as string).length || parentId !== null
        ? childDecks(decks, parentId as string)
        : decks.filter(
            (d) =>
              d.parentId === null && (d.folderId ?? null) === (folderId ?? null) && !d.archived,
          ),
    [decks, parentId, folderId],
  )

  return (
    <ul className="flex flex-col gap-2">
      {roots.map((deck) => (
        <DeckTreeNode
          key={deck.id}
          deck={deck}
          decks={decks}
          cards={cards}
          due={dueCounts.get(deck.id) ?? 0}
          dueCounts={dueCounts}
          expanded={expanded}
          onToggle={onToggle}
          onOpen={onOpen}
          deckActions={deckActions}
          swipe={swipe}
          swipeHandlers={swipeHandlers}
        />
      ))}
    </ul>
  )
}

const INDENT = 16

interface NodeProps {
  deck: Deck
  decks: Deck[]
  cards: Card[]
  due: number
  dueCounts: Map<string, number>
  expanded: ReadonlySet<string>
  onToggle: (deckId: string) => void
  onOpen: (deckId: string) => void
  deckActions?: (deck: Deck) => SheetAction[]
  swipe?: SwipeConfig
  swipeHandlers?: (deck: Deck) => SwipeActionHandlers
}

function DeckTreeNode({
  deck,
  decks,
  cards,
  due,
  dueCounts,
  expanded,
  onToggle,
  onOpen,
  deckActions,
  swipe,
  swipeHandlers,
}: NodeProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const children = childDecks(decks, deck.id)
  const hasChildren = children.length > 0
  const isOpen = expanded.has(deck.id)
  const actions = deckActions?.(deck)
  const hasActions = actions != null && actions.length > 0

  const [menuOpen, setMenuOpen] = useState(false)
  const longPress = useLongPress({
    onLongPress: () => hasActions && setMenuOpen(true),
    onTap: () => onOpen(deck.id),
  })

  const { leading, trailing } =
    swipe && swipeHandlers
      ? buildSwipeActions(swipe, swipeHandlers(deck), t)
      : { leading: [], trailing: [] }
  const swipeEnabled = leading.length > 0 || trailing.length > 0

  const row = (
    <div className="flex items-center gap-1.5 rounded-card bg-card py-2 pl-1.5 pr-2 shadow-rest">
      {hasChildren ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.82 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          onClick={() => onToggle(deck.id)}
          aria-label={isOpen ? t('deck.collapse') : t('deck.expand')}
          aria-expanded={isOpen}
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-full ring-1 transition-colors',
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
            isOpen
              ? 'bg-primary/10 text-primary ring-primary/15'
              : 'bg-info-surface text-primary ring-primary/10',
          )}
        >
          {isOpen ? (
            <Minus className="size-4" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
        </motion.button>
      ) : (
        <span className="size-7 shrink-0" aria-hidden />
      )}

      <button
        type="button"
        {...longPress}
        className="group/row flex min-w-0 flex-1 items-center gap-3 rounded-control py-0.5 pr-1 text-left transition-colors active:bg-primary/[0.04]"
      >
        <span className="relative shrink-0">
          <DeckCover
            icon={deck.icon || DEFAULT_DECK_ICON}
            color={deckColor(deck)}
            className="size-9 rounded-card shadow-rest ring-1 ring-black/5 transition-transform duration-200 ease-out group-active/row:scale-[0.94]"
            iconClassName="text-base leading-none"
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
          <span className="block truncate text-[length:var(--p-text-body)] font-semibold text-heading">
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
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-active/row:translate-x-0.5"
          aria-hidden
        />
      </button>
    </div>
  )

  return (
    <li>
      {swipeEnabled ? (
        <SwipeRow leading={leading} trailing={trailing}>
          {row}
        </SwipeRow>
      ) : (
        row
      )}

      {hasActions ? (
        <ActionSheet
          open={menuOpen}
          onOpenChange={setMenuOpen}
          title={deck.name}
          actions={actions}
          cancelLabel={t('common.cancel')}
        />
      ) : null}

      <AnimatePresence initial={false}>
        {hasChildren && isOpen ? (
          <motion.ul
            className="flex flex-col gap-2 overflow-hidden pt-2"
            style={{ marginLeft: INDENT }}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
          >
            {children.map((child) => (
              <DeckTreeNode
                key={child.id}
                deck={child}
                decks={decks}
                cards={cards}
                due={dueCounts.get(child.id) ?? 0}
                dueCounts={dueCounts}
                expanded={expanded}
                onToggle={onToggle}
                onOpen={onOpen}
                deckActions={deckActions}
                swipe={swipe}
                swipeHandlers={swipeHandlers}
              />
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </li>
  )
}
