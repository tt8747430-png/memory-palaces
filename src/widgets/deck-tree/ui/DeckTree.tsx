import { useMemo } from 'react'
import { ChevronRight, Minus, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import type { Deck } from '@/entities/deck'
import type { Card } from '@/entities/card'
import { childDecks, cn, dueCountsPerDeck } from '@/shared/lib'
import { OverflowMenuButton } from '@/shared/ui'
import type { SheetAction } from '@/shared/ui'

export interface DeckTreeProps {
  /** Every deck in the library (the tree filters to the container it renders). */
  decks: Deck[]
  /** Every card, for the per-node subtree due-count badge. */
  cards: Card[]
  /** Ids of decks whose subdecks are shown; toggled by the row's +/− control. */
  expanded: ReadonlySet<string>
  onToggle: (deckId: string) => void
  onOpen: (deckId: string) => void
  /** Overflow (⋮) actions for a deck row; omit to hide the kebab. */
  deckActions?: (deck: Deck) => SheetAction[]
  /** Which container to render: a parent deck's id, or `null` + `folderId` for the root. */
  parentId?: string | null
  folderId?: string | null
  now?: number
}

/**
 * The recursive deck tree: inline rows with a `+`/`−` disclosure, connector lines for depth, a
 * subtree "cards for today" badge, and a chevron to open the deck. Tapping the row opens the
 * deck (its whole subtree); tapping `+`/`−` expands its subdecks in place.
 */
export function DeckTree({
  decks,
  cards,
  expanded,
  onToggle,
  onOpen,
  deckActions,
  parentId = null,
  folderId = null,
  now = Date.now(),
}: DeckTreeProps) {
  const dueCounts = useMemo(() => dueCountsPerDeck(decks, cards, now), [decks, cards, now])
  const roots = useMemo(
    () =>
      childDecks(decks, parentId as string).length || parentId !== null
        ? childDecks(decks, parentId as string)
        : decks.filter((d) => d.parentId === null && (d.folderId ?? null) === (folderId ?? null)),
    [decks, parentId, folderId],
  )

  return (
    <ul className="flex flex-col">
      {roots.map((deck) => (
        <DeckTreeNode
          key={deck.id}
          deck={deck}
          decks={decks}
          cards={cards}
          depth={0}
          due={dueCounts.get(deck.id) ?? 0}
          dueCounts={dueCounts}
          expanded={expanded}
          onToggle={onToggle}
          onOpen={onOpen}
          deckActions={deckActions}
        />
      ))}
    </ul>
  )
}

interface NodeProps {
  deck: Deck
  decks: Deck[]
  cards: Card[]
  depth: number
  due: number
  dueCounts: Map<string, number>
  expanded: ReadonlySet<string>
  onToggle: (deckId: string) => void
  onOpen: (deckId: string) => void
  deckActions?: (deck: Deck) => SheetAction[]
}

function DeckTreeNode({
  deck,
  decks,
  cards,
  depth,
  due,
  dueCounts,
  expanded,
  onToggle,
  onOpen,
  deckActions,
}: NodeProps) {
  const children = childDecks(decks, deck.id)
  const hasChildren = children.length > 0
  const isOpen = expanded.has(deck.id)
  const actions = deckActions?.(deck)

  return (
    <li>
      <div className="relative flex items-center gap-3 border-b border-border py-3 pr-1">
        {/* Depth connector rails. */}
        {depth > 0 ? (
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 flex"
            style={{ width: depth * 20 }}
          >
            {Array.from({ length: depth }).map((_, i) => (
              <span key={i} className="w-5 border-l border-border/70" />
            ))}
          </span>
        ) : null}

        <div style={{ width: depth * 20 }} className="shrink-0" aria-hidden />

        {hasChildren ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggle(deck.id)}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            aria-expanded={isOpen}
            className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground"
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
          onClick={() => onOpen(deck.id)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[length:var(--p-text-body)] font-semibold text-heading">
              {deck.name}
            </span>
            <span className="block truncate text-[length:var(--p-text-label)] text-muted-foreground">
              {due > 0 ? `Cards for today: ${due}` : 'No cards added yet'}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </button>

        {actions && actions.length > 0 ? (
          <OverflowMenuButton actions={actions} label={`${deck.name} actions`} />
        ) : null}
      </div>

      {hasChildren && isOpen ? (
        <ul className={cn('flex flex-col')}>
          {children.map((child) => (
            <DeckTreeNode
              key={child.id}
              deck={child}
              decks={decks}
              cards={cards}
              depth={depth + 1}
              due={dueCounts.get(child.id) ?? 0}
              dueCounts={dueCounts}
              expanded={expanded}
              onToggle={onToggle}
              onOpen={onOpen}
              deckActions={deckActions}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
