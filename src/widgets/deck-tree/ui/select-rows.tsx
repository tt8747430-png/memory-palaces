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

/**
 * A row in select mode: the whole frame is one toggle, and the drag handle is
 * that same button, so a press reorders and a tap selects. Folders and decks
 * differ only in their frame and the body they show.
 */
function SelectRow({
  id,
  name,
  frame,
  highlight,
  selected,
  onToggleSelect,
  landingRef,
  children,
}: SelectRowProps & {
  id: string
  name: string
  frame: string
  highlight?: string | false
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <SortableRow as="li" id={id} landingRef={landingRef}>
      {({ frameRef, handleRef, handleProps, isDragging }) => (
        <div
          ref={frameRef}
          className={cn(
            frame,
            ROW_SURFACE,
            selected && 'ring-2 ring-inset ring-accent',
            highlight,
            isDragging && 'opacity-0',
          )}
        >
          <button
            type="button"
            ref={handleRef}
            onClick={() => onToggleSelect(id)}
            {...handleProps}
            aria-label={t('library.select.toggle', { name })}
            aria-pressed={selected}
            className={ROW_HIT}
          />
          {children}
        </div>
      )}
    </SortableRow>
  )
}

export function SelectFolderRow({
  folder,
  deckCount,
  isDropTarget,
  ...row
}: SelectRowProps & { folder: Folder; deckCount: number; isDropTarget: boolean }) {
  return (
    <SelectRow
      {...row}
      id={folder.id}
      name={folder.name}
      frame={FOLDER_ROW_FRAME}
      highlight={
        isDropTarget && 'bg-accent/[0.08] ring-2 ring-accent ring-offset-2 ring-offset-background'
      }
    >
      <FolderRowBody
        folder={folder}
        deckCount={deckCount}
        selected={row.selected}
        isDropTarget={isDropTarget}
      />
    </SelectRow>
  )
}

export function SelectDeckRow({
  deck,
  due,
  ...row
}: SelectRowProps & { deck: Deck; due: number }) {
  return (
    <SelectRow {...row} id={deck.id} name={deck.name} frame={DECK_ROW_FRAME}>
      <DeckRowBody deck={deck} due={due} selectState={row.selected ? 'checked' : 'unchecked'} />
    </SelectRow>
  )
}
