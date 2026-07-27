import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Deck } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import { cn } from '@/shared/lib'
import { SortableRow } from '@/shared/ui'
import { DeckDragPreview, DeckRowBody } from './deck-row'
import { FolderDragPreview, FolderRowBody } from './folder-row'
import { DECK_ROW_FRAME, FOLDER_ROW_FRAME } from './row-style'

const ROW_SURFACE = 'relative bg-card shadow-card transition-[box-shadow,background-color]'
const ROW_HIT =
  'absolute inset-0 touch-pan-y rounded-card transition-colors active:bg-primary/[0.06]'

/** A labelled block of peers. The label is dropped when there is only one block on screen. */
export function Section({
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
          className="px-1 pb-2 pt-3 text-(length:--p-text-label) font-semibold text-muted-foreground"
        >
          {label}
        </h2>
      ) : null}
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}

/** One row of the pile in hand — whichever kind it turns out to be. */
export function StackLayer({
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

export function SelectFolderRow({
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
            ROW_SURFACE,
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
            className={ROW_HIT}
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

export function SelectDeckRow({
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
            ROW_SURFACE,
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
            className={ROW_HIT}
          />
          <DeckRowBody deck={deck} due={due} selectState={selected ? 'checked' : 'unchecked'} />
        </div>
      )}
    </SortableRow>
  )
}
