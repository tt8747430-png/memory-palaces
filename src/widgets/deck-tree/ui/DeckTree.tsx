import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SortableContext, type SortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { ChevronRight, CornerDownRight, Minus, Plus } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  type Deck,
  DECK_COLOR_OPTIONS,
  DEFAULT_DECK_COLOR,
  DEFAULT_DECK_ICON,
} from '@/entities/deck'
import type { Card } from '@/entities/card'
import type { SwipeConfig } from '@/shared/config/swipe'
import {
  cn,
  deckSelectionStates,
  type DropIntent,
  dueCountsPerDeck,
  type SelectState,
  siblingDecks,
  useLongPress,
} from '@/shared/lib'
import {
  buildSwipeActions,
  DeckCover,
  DropIndicator,
  SelectDot,
  type SwipeActionHandlers,
  SwipeRow,
} from '@/shared/ui'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

/**
 * Rows never make room for a dragged card. Sortable's shifting is a promise that
 * the drop is a *reorder* — and in a tree it isn't, half the time. What the drop
 * will do is said explicitly instead: a line in the seam for a reorder, a ring
 * on the row for a nest. A still list is what lets those two read as different.
 */
const NO_SHIFT: SortingStrategy = () => null

/** Stable empty set so an un-dragging tree never re-renders on a fresh identity. */
const NO_CARRIED: ReadonlySet<string> = new Set()

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
  /** Rows travelling with the current multi-select drag — dimmed in place. */
  carriedIds?: ReadonlySet<string>
  onRequestSelect: (deckId: string) => void
  onToggleSelect: (deckId: string) => void
  /** Where the dragged card would land: a ring on a row, or a line in a seam. */
  drop?: DropIntent | null
  /** True while a drop is still landing — see `settling` in DeckTreeNode. */
  settling?: boolean
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
  carriedIds = NO_CARRIED,
  onRequestSelect,
  onToggleSelect,
  drop = null,
  settling = false,
  swipe,
  swipeHandlers,
  parentId = null,
  folderId = null,
  now = Date.now(),
}: DeckTreeProps) {
  const dueCounts = useMemo(() => dueCountsPerDeck(decks, cards, now), [decks, cards, now])
  // Each deck's checkbox reads the coverage of its whole subtree: checked, partial, or none.
  const selectStates = useMemo(() => deckSelectionStates(decks, selectedIds), [decks, selectedIds])
  // The top level is scoped to the open folder; deeper levels resolve by parent.
  const roots = useMemo(
    () => siblingDecks(decks, parentId, folderId ?? null),
    [decks, parentId, folderId],
  )

  // Each sibling group is its own sortable list, so a drag reorders within the
  // group (smooth slide) while a drop onto another deck/folder reparents.
  return (
    <ul className="flex flex-col gap-2">
      <SortableContext items={roots.map((d) => d.id)} strategy={NO_SHIFT}>
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
            selectStates={selectStates}
            carriedIds={carriedIds}
            onRequestSelect={onRequestSelect}
            onToggleSelect={onToggleSelect}
            drop={drop}
            settling={settling}
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

/** Row geometry, shared by the live row and the drag preview so a dropped card
 *  lands on its own footprint instead of morphing into a differently-shaped one. */
const ROW_FRAME = 'flex items-center gap-1.5 rounded-card py-2 pl-1.5 pr-2'
const toggleFrame = (isSub: boolean) => (isSub ? 'size-6' : 'size-7')
const toggleSurface = (isOpen: boolean) =>
  isOpen
    ? 'bg-primary/10 text-primary ring-primary/15'
    : 'bg-info-surface text-primary ring-primary/10'
const TOGGLE_BASE = 'grid shrink-0 place-items-center rounded-full ring-1 transition-colors'

interface RowBodyProps {
  deck: Deck
  due: number
  isSub: boolean
  selectMode: boolean
  selectState: SelectState
  /** The expand control — interactive in the tree, inert in the drag preview. */
  toggle: ReactNode
  isNestTarget?: boolean
}

/** Everything inside a deck row: select dot, expand toggle, cover, name, due. */
function DeckRowBody({
  deck,
  due,
  isSub,
  selectMode,
  selectState,
  toggle,
  isNestTarget = false,
}: RowBodyProps) {
  const { t } = useTranslation()

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
        <motion.span
          className="relative shrink-0"
          animate={{ scale: isNestTarget ? 1.14 : 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 20 }}
        >
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
    </>
  )
}

export interface DeckDragPreviewProps {
  deck: Deck
  due: number
  isSub: boolean
  selected: boolean
  hasChildren: boolean
  isOpen: boolean
  /** The card is over a nest target — it shows where it is about to land. */
  nesting: boolean
}

/**
 * The card in hand. It is the row, one elevation up: same frame, same controls,
 * same select dot — so when it is dropped it settles onto the real row instead
 * of cross-fading into a different shape.
 */
export function DeckDragPreview({
  deck,
  due,
  isSub,
  selected,
  hasChildren,
  isOpen,
  nesting,
}: DeckDragPreviewProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        ROW_FRAME,
        'bg-card shadow-elevated ring-1',
        nesting ? 'ring-2 ring-accent' : 'ring-border/60',
      )}
    >
      <DeckRowBody
        deck={deck}
        due={due}
        isSub={isSub}
        selectMode
        selectState={selected ? 'checked' : 'unchecked'}
        toggle={
          hasChildren ? (
            <span
              aria-hidden
              className={cn(TOGGLE_BASE, toggleFrame(isSub), toggleSurface(isOpen))}
            >
              {isOpen ? (
                <Minus className={isSub ? 'size-3.5' : 'size-4'} />
              ) : (
                <Plus className={isSub ? 'size-3.5' : 'size-4'} />
              )}
            </span>
          ) : (
            <span className={cn('shrink-0', toggleFrame(isSub))} aria-hidden />
          )
        }
      />

      {/* The one thing the row can't say: this drop nests instead of reorders. */}
      <AnimatePresence>
        {nesting ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            className="ml-1 grid size-7 shrink-0 place-items-center rounded-full bg-accent text-[color:var(--surface)]"
            role="img"
            aria-label={t('deck.nestHint')}
          >
            <CornerDownRight className="size-4" aria-hidden />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

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
  selectStates: ReadonlyMap<string, SelectState>
  carriedIds: ReadonlySet<string>
  onRequestSelect: (deckId: string) => void
  onToggleSelect: (deckId: string) => void
  drop: DropIntent | null
  settling: boolean
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
  selectStates,
  carriedIds,
  onRequestSelect,
  onToggleSelect,
  drop,
  settling,
  swipe,
  swipeHandlers,
}: NodeProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const children = siblingDecks(decks, deck.id)
  const hasChildren = children.length > 0
  const isOpen = expanded.has(deck.id)
  const isSub = depth > 0
  // The row's own selection (ring, drag payload); the checkbox reads the subtree's coverage.
  const selected = selectedIds.has(deck.id)
  const selectState = selectStates.get(deck.id) ?? 'unchecked'
  // Dimmed in place while it (or its parent) travels with a multi-select drag.
  const carried = carriedIds.has(deck.id)

  // The reveal has to clip the top seam while its height animates open, but a
  // four-sided clip shears the subdeck shadows flat and pops them back rounded at
  // the end — that pop is the flicker. While animating we clip only the top and
  // let the other edges bleed (see the `clipPath` below); at rest the clip is
  // dropped so every shadow is whole. Seeded from `isOpen` so a deck restored
  // open on load (its enter is suppressed) starts settled.
  const [childrenSettled, setChildrenSettled] = useState(isOpen)

  const longPress = useLongPress({
    onLongPress: () => onRequestSelect(deck.id),
    onTap: () => onOpen(deck.id),
  })

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging, active } =
    useSortable({ id: deck.id, disabled: !selectMode })

  const dropHere = drop?.targetId === deck.id ? drop.zone : null
  const isNestTarget = dropHere === 'nest'

  /**
   * No entrance animation while a card is in hand or still landing.
   *
   * A reparented deck's row unmounts from its old group and mounts in its new
   * one, and a mount-entrance would animate `opacity` on exactly the row that
   * dnd-kit is holding invisible (inline `opacity: 0`) while the drag overlay
   * flies onto it. Motion would win that fight, the row would fade up *under*
   * the card still in flight, and the drop would read as a flicker — two copies
   * of the same deck. Staying still through the landing is what makes the drop
   * look like one object coming to rest.
   */
  const quiet = active != null || settling

  const { leading, trailing } =
    swipe && swipeHandlers
      ? buildSwipeActions(swipe, swipeHandlers(deck), t)
      : { leading: [], trailing: [] }
  const swipeEnabled = !selectMode && (leading.length > 0 || trailing.length > 0)

  // Every row is a lifted card; subdecks stay legible as children through indent,
  // the spine, and a smaller cover rather than by sitting flat.
  const row = (
    <div
      ref={setNodeRef}
      className={cn(
        ROW_FRAME,
        'relative bg-card shadow-card transition-[box-shadow,background-color,transform]',
        selected && 'ring-2 ring-inset ring-accent',
        isNestTarget &&
          'scale-[1.015] bg-accent/[0.08] ring-2 ring-accent ring-offset-2 ring-offset-background',
        // The slot the card came out of, held open while it is in hand — it only
        // fades; scaling is reserved for a nest hover so a reorder doesn't shrink.
        isDragging && 'z-50',
        (isDragging || carried) && 'opacity-40',
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

      <DeckRowBody
        deck={deck}
        due={due}
        isSub={isSub}
        selectMode={selectMode}
        selectState={selectState}
        isNestTarget={isNestTarget}
        toggle={
          hasChildren ? (
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
    </div>
  )

  return (
    <motion.li
      // Rows glide to wherever the drop put them instead of teleporting there.
      layout={reduce ? false : 'position'}
      initial={isSub && !reduce && !quiet ? { opacity: 0, y: -6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.24,
        ease: EASE_OUT,
        layout: { type: 'spring', stiffness: 520, damping: 42 },
        // Rows that arrive mid-drag settle straight, without a stagger.
        delay: quiet || !isSub ? 0 : Math.min(index, 6) * 0.03,
      }}
    >
      <div className="relative">
        {swipeEnabled ? (
          <SwipeRow leading={leading} trailing={trailing} bleed>
            {row}
          </SwipeRow>
        ) : (
          row
        )}

        <AnimatePresence>
          {dropHere && dropHere !== 'nest' ? (
            <DropIndicator key={dropHere} position={dropHere} inset={isSub ? 8 : 0} />
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && isOpen ? (
          <motion.ul
            className="relative flex flex-col gap-2 pt-2"
            style={{
              paddingLeft: INDENT,
              // Clip the *top* seam of the wipe so rows can't spill above the
              // parent, but let the other three edges bleed: the sides 32px so
              // the cards' rounded shadows stay whole, and the bottom 24px past
              // the reveal line so the last subdeck's shadow shows the instant
              // the row does — instead of being shorn until the ease-out tail
              // finishes. The bottom bleed would peek the next row early, but the
              // rows' fade-in stagger tracks the wipe, so what peeks is still at
              // ~zero opacity. Dropped entirely at rest (`childrenSettled`).
              clipPath: childrenSettled ? undefined : 'inset(0px -32px -24px -32px)',
            }}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
            onAnimationStart={() => setChildrenSettled(false)}
            onAnimationComplete={() => setChildrenSettled(true)}
          >
            {/* Nesting spine — a soft vertical guide down the indent gutter. */}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-2 top-3 w-[2px] rounded-full bg-primary/[0.12]"
              style={{ left: INDENT / 2 - 1 }}
            />
            <SortableContext items={children.map((c) => c.id)} strategy={NO_SHIFT}>
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
                  selectStates={selectStates}
                  carriedIds={carriedIds}
                  onRequestSelect={onRequestSelect}
                  onToggleSelect={onToggleSelect}
                  drop={drop}
                  settling={settling}
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
