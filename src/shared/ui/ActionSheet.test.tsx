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
})
