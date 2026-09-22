import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SwipeActionId } from '@/shared/config/swipe'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ActionsPalette } from './ActionsPalette'

afterEach(cleanup)

const ALL: SwipeActionId[] = ['favorite', 'move', 'archive', 'delete']

function palette(placed: SwipeActionId[], over: { hasRoom?: boolean; canRemove?: boolean } = {}) {
  const onAdd = vi.fn()
  const onRemove = vi.fn()
  renderWithProviders(
    <ActionsPalette
      label="Actions"
      actions={ALL}
      placed={placed}
      hasRoom={over.hasRoom ?? true}
      canRemove={over.canRemove}
      onAdd={onAdd}
      onRemove={onRemove}
      hint="Drag to reorder."
    />,
  )
  return { onAdd, onRemove }
}

describe('ActionsPalette', () => {
  it('shows every action the surface has, on the strip or not — nothing is hidden', () => {
    palette(['move'])
    expect(screen.getAllByRole('switch')).toHaveLength(ALL.length)
  })

  it('says which are on', () => {
    palette(['move', 'delete'])
    expect(screen.getByRole('switch', { name: 'Move' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Favorite' })).not.toBeChecked()
  })

  it('adds with one tap, no sheet in between', async () => {
    const { onAdd } = palette(['move'])
    await userEvent.click(screen.getByRole('switch', { name: 'Archive' }))
    expect(onAdd).toHaveBeenCalledWith('archive')
  })

  it('takes one off with the same tap', async () => {
    const { onRemove } = palette(['move'])
    await userEvent.click(screen.getByRole('switch', { name: 'Move' }))
    expect(onRemove).toHaveBeenCalledWith('move')
  })

  it('leaves what is already on pressable when the strip is full — only adding stops', () => {
    palette(['move'], { hasRoom: false })
    expect(screen.getByRole('switch', { name: 'Archive' })).toBeDisabled()
    expect(screen.getByRole('switch', { name: 'Move' })).toBeEnabled()
  })

  it('refuses to take off the one the strip has to keep', () => {
    palette(['delete'], { canRemove: false })
    expect(screen.getByRole('switch', { name: 'Delete' })).toBeDisabled()
  })

  it('says in one line what the row can still do', () => {
    palette(['move'])
    expect(screen.getByText('Drag to reorder.')).toBeInTheDocument()
  })
})
