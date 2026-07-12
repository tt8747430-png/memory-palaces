import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  buildSwipeActions,
  DeckCover,
  SelectDot,
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
  selectMode: boolean
  selectedIds: ReadonlySet<string>
  onRequestSelect: (deckId: string) => void
  onToggleSelect: (deckId: string) => void
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
  selectMode,
  selectedIds,
  onRequestSelect,
  onToggleSelect,
  swipe,
  swipeHandlers,
  parentId = null,
  folderId = null,
  now = Date.now(),
}: DeckTreeProps) {
  const dueCounts = useMemo(() => dueCountsPerDeck(decks, cards, now), [decks, cards, now])
  const roots = useMemo(
    () =>
      // Nested calls resolve children by parent; the top level (parentId null)
      // must scope to the current folder — `childDecks(decks, null)` matches
      // every root-parent deck regardless of folder, which would surface
      // in-folder decks at the root (a deck moved into a folder looked copied).
      parentId !== null
        ? childDecks(decks, parentId)
        : decks.filter(
            (d) =>
              d.parentId === null && (d.folderId ?? null) === (folderId ?? null) && !d.archived,
          ),
    [decks, parentId, folderId],
  )

  // Each sibling group is its own sortable list, so a grip-drag reorders within
  // the group (smooth slide) while dropping onto another deck/folder reparents.
  return (
    <ul className="flex flex-col gap-2">
      <SortableContext items={roots.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        {roots.map((deck, index) => (
          <DeckTreeNode
            key={deck.id}
            deck={deck}
            index={index}
            depth={0}
            decks={decks}
            cards={cards}
            due={dueCounts.get(deck.id) ?? 0}
            dueCounts={dueCounts}
            expanded={expanded}
            onToggle={onToggle}
            onOpen={onOpen}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onRequestSelect={onRequestSelect}
            onToggleSelect={onToggleSelect}
            swipe={swipe}
            swipeHandlers={swipeHandlers}
          />
        ))}
      </SortableContext>
    </ul>
  )
}

/** Left gutter reserved for the nesting spine + indent at each deeper level. */
const INDENT = 22

interface NodeProps {
  deck: Deck
  index: number
  depth: number
  decks: Deck[]
  cards: Card[]
  due: number
  dueCounts: Map<string, number>
  expanded: ReadonlySet<string>
  onToggle: (deckId: string) => void
  onOpen: (deckId: string) => void
  selectMode: boolean
  selectedIds: ReadonlySet<string>
  onRequestSelect: (deckId: string) => void
  onToggleSelect: (deckId: string) => void
  swipe?: SwipeConfig
  swipeHandlers?: (deck: Deck) => SwipeActionHandlers
}

function DeckTreeNode({
  deck,
  index,
  depth,
  decks,
  cards,
  due,
  dueCounts,
  expanded,
  onToggle,
  onOpen,
  selectMode,
  selectedIds,
  onRequestSelect,
  onToggleSelect,
  swipe,
  swipeHandlers,
}: NodeProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  // Archived subdecks live in the Archive, not the tree.
  const children = childDecks(decks, deck.id).filter((d) => !d.archived)
  const hasChildren = children.length > 0
  const isOpen = expanded.has(deck.id)
  const isSub = depth > 0
  const selected = selectedIds.has(deck.id)

  const longPress = useLongPress({
    onLongPress: () => onRequestSelect(deck.id),
    onTap: () => onOpen(deck.id),
  })

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
  } = useSortable({ id: deck.id, disabled: !selectMode })

  // A drop onto a sibling reorders (the sortable slide is the feedback); a drop
  // onto any other deck nests, so only that case grows the "nest here" ring.
  // Only a dragged *deck* can nest (a folder over a deck is a no-op).
  const activeDeck = active ? decks.find((d) => d.id === active.id) : null
  const sameGroup =
    activeDeck != null &&
    activeDeck.parentId === deck.parentId &&
    (activeDeck.folderId ?? null) === (deck.folderId ?? null)
  const isNestTarget = isOver && activeDeck != null && active?.id !== deck.id && !sameGroup
  const dragActive = active != null

  const { leading, trailing } =
    swipe && swipeHandlers
      ? buildSwipeActions(swipe, swipeHandlers(deck), t)
      : { leading: [], trailing: [] }
  const swipeEnabled = !selectMode && (leading.length > 0 || trailing.length > 0)

  const toggleSize = isSub ? 'size-6' : 'size-7'
  const coverSize = isSub ? 'size-8' : 'size-9'

  // Every row is a lifted card; subdecks stay legible as children through indent,
  // the spine, and a smaller cover rather than by sitting flat.
  const surface = selected
    ? 'bg-card shadow-card ring-2 ring-inset ring-accent'
    : 'bg-card shadow-card'

  const row = (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative flex items-center gap-1.5 rounded-card py-2 pl-1.5 pr-2 transition-[box-shadow,background-color]',
        surface,
        isNestTarget && 'bg-accent/[0.08] ring-2 ring-accent ring-offset-2 ring-offset-background',
        // Faint ghost in the source slot while the DragOverlay clone is in hand.
        isDragging && 'relative z-50 opacity-40',
      )}
    >
      {/* Whole-card activator: a tap opens (or toggles selection); a press-and-hold
          starts the drag; `touch-pan-y` keeps the list scrollable until that hold. */}
      <button
        type="button"
        ref={selectMode ? setActivatorNodeRef : undefined}
        {...(selectMode
          ? { onClick: () => onToggleSelect(deck.id), ...attributes, ...listeners }
          : longPress)}
        aria-label={
          selectMode
            ? t('library.select.toggle', { name: deck.name })
            : t('deck.rowOpen', { name: deck.name })
        }
        aria-pressed={selectMode ? selected : undefined}
        className={cn(
          'absolute inset-0 rounded-card transition-colors active:bg-primary/[0.06]',
          selectMode && 'touch-pan-y',
        )}
      />

      {/* Select checkbox sits alongside the expand toggle so a deck can still be
          expanded while selecting. */}
      {selectMode ? (
        <span className="pointer-events-none relative z-20 grid size-6 shrink-0 place-items-center">
          <SelectDot selected={selected} />
        </span>
      ) : null}

      {hasChildren ? (
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
            'relative z-20 grid shrink-0 place-items-center rounded-full ring-1 transition-colors',
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
            toggleSize,
            isOpen
              ? 'bg-primary/10 text-primary ring-primary/15'
              : 'bg-info-surface text-primary ring-primary/10',
          )}
        >
          {isOpen ? (
            <Minus className={isSub ? 'size-3.5' : 'size-4'} aria-hidden />
          ) : (
            <Plus className={isSub ? 'size-3.5' : 'size-4'} aria-hidden />
          )}
        </motion.button>
      ) : (
        <span className={cn('relative z-10 shrink-0', toggleSize)} aria-hidden />
      )}

      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3">
        <motion.span
          className="relative shrink-0"
          animate={{ scale: isNestTarget ? 1.14 : 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 20 }}
        >
          <DeckCover
            icon={deck.icon || DEFAULT_DECK_ICON}
            color={deckColor(deck)}
            className={cn('rounded-2xl shadow-rest ring-1 ring-black/5', coverSize)}
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
        </motion.span>

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
    </div>
  )

  return (
    <motion.li
      initial={isSub && !reduce ? { opacity: 0, y: -6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.24,
        ease: EASE_OUT,
        // Pause the entrance stagger during a drag so reordered rows settle straight.
        delay: dragActive || !isSub ? 0 : Math.min(index, 6) * 0.03,
      }}
    >
      {swipeEnabled ? (
        <SwipeRow leading={leading} trailing={trailing} bleed>
          {row}
        </SwipeRow>
      ) : (
        row
      )}

      <AnimatePresence initial={false}>
        {hasChildren && isOpen ? (
          <motion.ul
            className="relative flex flex-col gap-2 overflow-hidden pt-2"
            style={{ paddingLeft: INDENT }}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
          >
            {/* Nesting spine — a soft vertical guide down the indent gutter. */}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-2 top-3 w-[2px] rounded-full bg-primary/[0.12]"
              style={{ left: INDENT / 2 - 1 }}
            />
            <SortableContext
              items={children.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {children.map((child, childIndex) => (
                <DeckTreeNode
                  key={child.id}
                  deck={child}
                  index={childIndex}
                  depth={depth + 1}
                  decks={decks}
                  cards={cards}
                  due={dueCounts.get(child.id) ?? 0}
                  dueCounts={dueCounts}
                  expanded={expanded}
                  onToggle={onToggle}
                  onOpen={onOpen}
                  selectMode={selectMode}
                  selectedIds={selectedIds}
                  onRequestSelect={onRequestSelect}
                  onToggleSelect={onToggleSelect}
                  swipe={swipe}
                  swipeHandlers={swipeHandlers}
                />
              ))}
            </SortableContext>
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </motion.li>
  )
}
