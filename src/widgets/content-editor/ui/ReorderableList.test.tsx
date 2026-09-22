import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { AppScreen } from '@/shared/ui'
import { ReorderableList } from './ReorderableList'
import type { SortableHandle } from '@/shared/ui'

afterEach(cleanup)

interface Item {
  id: string
  label: string
}

const ITEMS: Item[] = [
  { id: '1', label: 'Alpha' },
  { id: '2', label: 'Beta' },
]

const many = (count: number): Item[] =>
  Array.from({ length: count }, (_, at) => ({ id: String(at), label: `Row ${at}` }))

function renderItem(item: Item, handle?: SortableHandle) {
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

/** The list reads the screen's scroll element, so it is drawn inside a screen, as in the app. */
function renderList(items: Item[], reorderable: boolean) {
  renderWithProviders(
    <AppScreen>
      <ReorderableList
        items={items}
        reorderable={reorderable}
        onReorder={vi.fn()}
        renderItem={renderItem}
        estimateSize={100}
      />
    </AppScreen>,
  )
}

describe('ReorderableList', () => {
  it('renders each item statically without drag handles when not reorderable', () => {
    renderList(ITEMS, false)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Drag/ })).toBeNull()
  })

  it('renders each item in order with a drag handle when reorderable', () => {
    renderList(ITEMS, true)
    const handles = screen.getAllByRole('button', { name: /Drag/ })
    expect(handles.map((b) => b.getAttribute('aria-label'))).toEqual(['Drag Alpha', 'Drag Beta'])
  })

  it.each([false, true])(
    'draws a screenful of a long list, not every row (reorderable: %s)',
    (reorderable) => {
      renderList(many(500), reorderable)
      expect(screen.getByText('Row 0')).toBeInTheDocument()
      expect(screen.queryByText('Row 499')).toBeNull()
      // A window, and its overscan — tens of rows, whatever the list's length.
      expect(screen.getAllByText(/^Row \d+$/).length).toBeLessThan(30)
    },
  )

  it('sizes its box for every row, so the scroll reaches the end of the list', () => {
    renderList(many(500), false)
    const box = screen.getByText('Row 0').closest('[data-index]')!.parentElement!
    expect(parseInt(box.style.height, 10)).toBeGreaterThan(500 * 100)
  })
})
