import { type ReactNode, useCallback, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Deck } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import type { Card } from '@/entities/card'
import { cn, dueCountsPerDeck, impact, useSortableBlock, useSortableSensors } from '@/shared/lib'
import { SortableRow, StackedDragPreview } from '@/shared/ui'
import { DeckDragPreview, DeckRowBody } from './deck-row'
import { FolderDragPreview, FolderRowBody } from './folder-row'
import { DECK_ROW_FRAME, FOLDER_ROW_FRAME } from './row-style'

export interface LibrarySelectListProps {
  /** Folders of this scope, in order. Empty inside a folder — folders don't nest. */
  folders: Folder[]
  /** Top-level decks of this scope, in order. Subdecks ride along with their root, unseen. */
  decks: Deck[]
  /** The whole forest, so a row's due count can include the subdecks it carries. */
  allDecks: Deck[]
  cards: Card[]
  folderDeckCounts: Map<string, number>
  selectedIds: ReadonlySet<string>
  onToggleSelect: (id: string) => void
  onReorderFolders: (ids: string[]) => void
  onReorderDecks: (ids: string[]) => void
  /** A block of decks was dropped onto a folder row. */
  onFileDecks: (deckIds: string[], folderId: string) => void
  now?: number
}

/**
 * The library while a selection is live: one flat list of folders, then one flat list of decks.
 *
 * Everything on screen here is a peer of everything else in its section, which is what lets the
 * drag be honest — the rows that make room really are the rows the drop will reorder. The nesting
 * that the browse tree shows is deliberately absent: there is no expand control, so subdecks are
 * never on screen, and selecting a deck takes its whole subtree with it. Changing a deck's parent
 * is an explicit act (the Move sheet), never a side effect of where a finger let go.
 *
 * The one drop that isn't a reorder is a deck released over a folder row, which files it there —
 * a discrete target that says what it will do (it lights up) and can't be triggered by drifting.
 */
export function LibrarySelectList({
  folders,
  decks,
  allDecks,
  cards,
  folderDeckCounts,
  selectedIds,
  onToggleSelect,
  onReorderFolders,
  onReorderDecks,
  onFileDecks,
  now = Date.now(),
}: LibrarySelectListProps) {
  const { t } = useTranslation()
  const headingId = useId()
  const sensors = useSortableSensors()

  const [fileIntoId, setFileIntoId] = useState<string | null>(null)

  const dueCounts = useMemo(() => dueCountsPerDeck(allDecks, cards, now), [allDecks, cards, now])
  const folderIds = useMemo(() => folders.map((f) => f.id), [folders])
  const deckIds = useMemo(() => decks.map((d) => d.id), [decks])

  // A row's peers are the other rows of its own kind. A folder can neither be ordered among decks
  // nor ride along inside a block of them, so the two sections are two separate reorder universes.
  const sectionOf = useCallback(
    (id: string) => (folderIds.includes(id) ? folderIds : deckIds),
    [folderIds, deckIds],
  )
  // A folder drag may only ever be over another folder. A deck drag is left unscoped: folder rows
  // are not its peers, but they are still a legal thing to drop it on (it gets filed there).
  const scopeTo = useCallback(
    (id: string) => (folderIds.includes(id) ? folderIds : null),
    [folderIds],
  )
  const drag = useSortableBlock({ sectionOf, selectedIds, scopeTo })
  const draggingFolder = drag.activeId !== null && folderIds.includes(drag.activeId)

  const visibleFolders = folders.filter((f) => !drag.isHidden(f.id))
  const visibleDecks = decks.filter((d) => !drag.isHidden(d.id))

  const trackOver = (event: DragOverEvent) => {
    const overId = event.over ? String(event.over.id) : null
    const draggedId = String(event.active.id)
    if (folderIds.includes(draggedId) || !overId || !folderIds.includes(overId)) {
      setFileIntoId(null)
      return
    }
    setFileIntoId((prev) => {
      if (prev !== overId) impact()
      return overId
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    // Read what the drag was holding before `drop` clears the state it derives from.
    const wasFolder = draggingFolder
    const fileInto = fileIntoId
    const block = drag.carriedInOrder
    setFileIntoId(null)

    // Dropped on a folder: the decks leave this list for that folder, so there is nothing here
    // for them to land on — the folder's own count is the confirmation. Take that branch before
    // `drop` reads the drop as a reorder among peers, which it is not.
    if (!wasFolder && fileInto && block.length > 0) {
      drag.cancel()
      onFileDecks(block, fileInto)
      return
    }

    const result = drag.drop(event)
    if (!result) return
    if (wasFolder) onReorderFolders(result.order)
    else onReorderDecks(result.order)
  }

  const bothSections = folders.length > 0 && decks.length > 0
  const rowLookup = { folders, decks, dueCounts, folderDeckCounts, selectedIds }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={drag.collision}
      // Nothing horizontal means anything any more: sideways used to choose a nesting depth, and
      // that is exactly the gesture this list removed.
      modifiers={[restrictToVerticalAxis]}
      onDragStart={(event: DragStartEvent) => drag.start(String(event.active.id))}
      onDragOver={trackOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        drag.cancel()
        setFileIntoId(null)
      }}
    >
      <div className="flex flex-col gap-2 pt-2">
        {folders.length > 0 ? (
          <Section
            id={`${headingId}-folders`}
            label={bothSections ? t('library.select.folders') : null}
          >
            <SortableContext
              items={visibleFolders.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {visibleFolders.map((folder) => (
                <SelectFolderRow
                  key={folder.id}
                  folder={folder}
                  deckCount={folderDeckCounts.get(folder.id) ?? 0}
                  selected={selectedIds.has(folder.id)}
                  isDropTarget={fileIntoId === folder.id}
                  onToggleSelect={onToggleSelect}
                  landingRef={drag.landingRef(folder.id)}
                />
              ))}
            </SortableContext>
          </Section>
        ) : null}

        {decks.length > 0 ? (
          <Section
            id={`${headingId}-decks`}
            label={bothSections ? t('library.select.decks') : null}
          >
            <SortableContext
              items={visibleDecks.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              {visibleDecks.map((deck) => (
                <SelectDeckRow
                  key={deck.id}
                  deck={deck}
                  due={dueCounts.get(deck.id) ?? 0}
                  selected={selectedIds.has(deck.id)}
                  onToggleSelect={onToggleSelect}
                  landingRef={drag.landingRef(deck.id)}
                />
              ))}
            </SortableContext>
          </Section>
        ) : null}
      </div>

      {/* A stack clears the instant the finger lifts — its count is a fact about the drag, and the
          drag is over. The rows it was holding travel to their slots themselves (`land`). */}
      <DragOverlay dropAnimation={drag.dropAnimation}>
        {drag.stackIds.length > 0 ? (
          <StackedDragPreview
            count={drag.carriedIds.size}
            layers={drag.stackIds.slice(1).map((id) => (
              <StackLayer key={id} id={id} {...rowLookup} />
            ))}
          >
            <StackLayer id={drag.stackIds[0]!} {...rowLookup} />
          </StackedDragPreview>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function Section({
  id,
  label,
  children,
}: {
  id: string
  label: string | null
  children: ReactNode
}) {
  return (
    <section aria-labelledby={label ? id : undefined}>
      {label ? (
        <h2
          id={id}
          className="px-1 pb-2 pt-3 text-[length:var(--p-text-label)] font-semibold text-muted-foreground"
        >
          {label}
        </h2>
      ) : null}
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}

/** One row of the pile in hand — whichever kind it turns out to be. */
function StackLayer({
  id,
  folders,
  decks,
  dueCounts,
  folderDeckCounts,
  selectedIds,
}: {
  id: string
  folders: Folder[]
  decks: Deck[]
  dueCounts: Map<string, number>
  folderDeckCounts: Map<string, number>
  selectedIds: ReadonlySet<string>
}) {
  const folder = folders.find((f) => f.id === id)
  if (folder) {
    return (
      <FolderDragPreview
        folder={folder}
        deckCount={folderDeckCounts.get(folder.id) ?? 0}
        selected={selectedIds.has(folder.id)}
      />
    )
  }
  const deck = decks.find((d) => d.id === id)
  if (!deck) return null
  return (
    <DeckDragPreview
      deck={deck}
      due={dueCounts.get(deck.id) ?? 0}
      selected={selectedIds.has(deck.id)}
    />
  )
}

interface SelectRowProps {
  selected: boolean
  onToggleSelect: (id: string) => void
  landingRef: (node: HTMLElement | null) => void
}

function SelectFolderRow({
  folder,
  deckCount,
  isDropTarget,
  selected,
  onToggleSelect,
  landingRef,
}: SelectRowProps & { folder: Folder; deckCount: number; isDropTarget: boolean }) {
  const { t } = useTranslation()
  return (
    <SortableRow as="li" id={folder.id} landingRef={landingRef}>
      {({ frameRef, handleRef, handleProps, isDragging }) => (
        <div
          ref={frameRef}
          className={cn(
            FOLDER_ROW_FRAME,
            'relative bg-card shadow-card transition-[box-shadow,background-color]',
            selected && 'ring-2 ring-inset ring-accent',
            isDropTarget &&
              'bg-accent/[0.08] ring-2 ring-accent ring-offset-2 ring-offset-background',
            isDragging && 'opacity-0',
          )}
        >
          <button
            type="button"
            ref={handleRef}
            onClick={() => onToggleSelect(folder.id)}
            {...handleProps}
            aria-label={t('library.select.toggle', { name: folder.name })}
            aria-pressed={selected}
            className="absolute inset-0 touch-pan-y rounded-card transition-colors active:bg-primary/[0.06]"
          />
          <FolderRowBody
            folder={folder}
            deckCount={deckCount}
            selected={selected}
            isDropTarget={isDropTarget}
          />
        </div>
      )}
    </SortableRow>
  )
}

function SelectDeckRow({
  deck,
  due,
  selected,
  onToggleSelect,
  landingRef,
}: SelectRowProps & { deck: Deck; due: number }) {
  const { t } = useTranslation()
  return (
    <SortableRow as="li" id={deck.id} landingRef={landingRef}>
      {({ frameRef, handleRef, handleProps, isDragging }) => (
        <div
          ref={frameRef}
          className={cn(
            DECK_ROW_FRAME,
            'relative bg-card shadow-card transition-[box-shadow,background-color]',
            selected && 'ring-2 ring-inset ring-accent',
            isDragging && 'opacity-0',
          )}
        >
          <button
            type="button"
            ref={handleRef}
            onClick={() => onToggleSelect(deck.id)}
            {...handleProps}
            aria-label={t('library.select.toggle', { name: deck.name })}
            aria-pressed={selected}
            className="absolute inset-0 touch-pan-y rounded-card transition-colors active:bg-primary/[0.06]"
          />
          <DeckRowBody deck={deck} due={due} selectState={selected ? 'checked' : 'unchecked'} />
        </div>
      )}
    </SortableRow>
  )
}
