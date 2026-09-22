import { DndContext, DragOverlay } from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import {
  type SelectActionId,
  type SelectToolbarConfig,
  selectToolbarCanShrink,
} from '@/shared/config/select-toolbar'
import { DockPill, SelectToolbarRow, SelectToolbarSlot } from '@/shared/ui'
import { useSortableList } from '../model/use-sortable-list'
import { SortableActionSlot } from './SortableActionSlot'

export interface SelectToolbarBarProps {
  config: SelectToolbarConfig
  onChange: (config: SelectToolbarConfig) => void
}

/**
 * The bar the learner gets while things are selected — the dock's own pill, at the dock's own size,
 * and live. Nothing here is a scaled-down likeness: the slots are `SelectToolbarSlot`, the same
 * component the real toolbar draws, so arranging the bar and using it cannot drift apart. A slot
 * drags to reorder and its badge takes it off, down to the last (`selectToolbarCanShrink`).
 */
export function SelectToolbarBar({ config, onChange }: SelectToolbarBarProps) {
  const list = useSortableList<SelectActionId>({ ids: config, onDrop: onChange })
  const removable = selectToolbarCanShrink([...list.items])

  return (
    <DndContext {...list.dnd} modifiers={[restrictToHorizontalAxis]}>
      <div className="mx-auto h-16 w-64">
        <DockPill>
          <SortableContext items={[...list.items]} strategy={horizontalListSortingStrategy}>
            <SelectToolbarRow>
              {list.items.map((id) => (
                <SortableActionSlot
                  key={id}
                  action={id}
                  className="flex h-full min-w-0 flex-1"
                  onRemove={
                    removable ? () => onChange(list.items.filter((each) => each !== id)) : undefined
                  }
                >
                  <SelectToolbarSlot action={id} />
                </SortableActionSlot>
              ))}
            </SelectToolbarRow>
          </SortableContext>
        </DockPill>
      </div>

      {/* The slot itself, lifted — the overlay takes the dragged slot's size, so the tile under the
          finger is the one it picked up and nothing changes shape on the drop (CODE_STYLE §10). */}
      <DragOverlay {...list.overlay}>
        {list.activeId ? (
          <span className="flex h-full w-full cursor-grabbing">
            <SelectToolbarSlot action={list.activeId} />
          </span>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
