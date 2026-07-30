import { useCallback, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Deck } from '@/entities/deck'
import type { Folder } from '@/entities/folder'
import type { Card } from '@/entities/card'
import { dueCountsPerDeck, impact, useSortableBlock, useSortableSensors } from '@/shared/lib'
import { StackedDragPreview } from '@/shared/ui'
import { Section, SelectDeckRow, SelectFolderRow, StackLayer } from './select-rows'

export interface LibrarySelectListProps {
  folders: Folder[]
  decks: Deck[]
  allDecks: Deck[]
  cards: Card[]
  folderDeckCounts: Map<string, number>
  selectedIds: ReadonlySet<string>
  onToggleSelect: (id: string) => void
  onReorderFolders: (ids: string[]) => void
  onReorderDecks: (ids: string[]) => void
  onFileDecks: (deckIds: string[], folderId: string) => void
  now?: number
}

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

  const sectionOf = useCallback(
    (id: string) => (folderIds.includes(id) ? folderIds : deckIds),
    [folderIds, deckIds],
  )
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
    const wasFolder = draggingFolder
    const fileInto = fileIntoId
    const block = drag.carriedInOrder
    setFileIntoId(null)

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
