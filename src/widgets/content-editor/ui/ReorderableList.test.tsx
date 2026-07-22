import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ReorderableList } from './ReorderableList'
import type { RowDragHandle } from './ContentRows'

afterEach(cleanup)

interface Item {
  id: string
  label: string
}

const ITEMS: Item[] = [
  { id: '1', label: 'Alpha' },
  { id: '2', label: 'Beta' },
]

function renderItem(item: Item, handle?: RowDragHandle) {
  return (
    <div key={item.id}>
      <span>{item.label}</span>
      {handle ? (
        <button type="button" aria-label={`Drag ${item.label}`} ref={handle.ref}>
          ⠿
        </button>
      ) : null}
    </div>
  )
}

describe('ReorderableList', () => {
  it('renders each item statically without drag handles when not reorderable', () => {
    renderWithProviders(
      <ReorderableList
        items={ITEMS}
        reorderable={false}
        onReorder={() => {}}
        renderItem={renderItem}
      />,
    )
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Drag/ })).toBeNull()
  })

  it('renders each item in order with a drag handle when reorderable', () => {
    renderWithProviders(
      <ReorderableList items={ITEMS} reorderable onReorder={vi.fn()} renderItem={renderItem} />,
    )
    const handles = screen.getAllByRole('button', { name: /Drag/ })
    expect(handles.map((b) => b.getAttribute('aria-label'))).toEqual(['Drag Alpha', 'Drag Beta'])
  })
})
