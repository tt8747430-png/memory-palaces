import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ActionSheet, type SheetAction } from './ActionSheet'

afterEach(cleanup)

function open(actions: SheetAction[], onOpenChange = vi.fn()) {
  renderWithProviders(
    <ActionSheet
      open
      onOpenChange={onOpenChange}
      title="Deck actions"
      actions={actions}
      cancelLabel="Cancel"
    />,
  )
  return onOpenChange
}

describe('ActionSheet', () => {
  it('renders each action and the cancel control when open', async () => {
    open([
      { id: 'rename', label: 'Rename', onSelect: () => {} },
      { id: 'delete', label: 'Delete', destructive: true, onSelect: () => {} },
    ])
    expect(await screen.findByRole('button', { name: 'Rename' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('closes and runs the selected action', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onOpenChange = open([{ id: 'rename', label: 'Rename', onSelect }])
    await user.click(await screen.findByRole('button', { name: 'Rename' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not run a disabled action', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    open([{ id: 'rename', label: 'Rename', disabled: true, onSelect }])
    await user.click(await screen.findByRole('button', { name: 'Rename' }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('keeps the title for screen readers when it is hidden', async () => {
    renderWithProviders(
      <ActionSheet
        open
        hideTitle
        onOpenChange={() => {}}
        title="Card actions"
        actions={[{ id: 'edit', label: 'Edit', onSelect: () => {} }]}
      />,
    )
    expect(await screen.findByText('Card actions')).toHaveClass('sr-only')
  })

  it('omits the cancel row when no label is given', async () => {
    renderWithProviders(
      <ActionSheet
        open
        onOpenChange={() => {}}
        title="Card actions"
        actions={[{ id: 'edit', label: 'Edit', onSelect: () => {} }]}
      />,
    )
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
  })

  it('marks the selected action for assistive tech', async () => {
    renderWithProviders(
      <ActionSheet
        open
        onOpenChange={() => {}}
        title="Card font"
        actions={[
          { id: 'serif', label: 'Serif', selected: true, onSelect: () => {} },
          { id: 'mono', label: 'Monospace', onSelect: () => {} },
        ]}
      />,
    )
    expect(await screen.findByRole('button', { name: 'Serif' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Monospace' })).not.toHaveAttribute('aria-current')
  })
})
