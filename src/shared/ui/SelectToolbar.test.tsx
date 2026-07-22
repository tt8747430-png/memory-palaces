import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SelectToolbar } from './SelectToolbar'

afterEach(cleanup)

describe('SelectToolbar', () => {
  it('renders a button per configured action that has a handler', () => {
    renderWithProviders(
      <SelectToolbar
        actions={['flag', 'delete']}
        handlers={{ flag: { onAction: () => {} }, delete: { onAction: () => {} } }}
      />,
    )
    expect(screen.getByRole('button', { name: 'Flag' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('runs an action handler on click and disables one flagged disabled', async () => {
    const user = userEvent.setup()
    const onFlag = vi.fn()
    const onDelete = vi.fn()
    renderWithProviders(
      <SelectToolbar
        actions={['flag', 'delete']}
        handlers={{ flag: { onAction: onFlag }, delete: { onAction: onDelete, disabled: true } }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Flag' }))
    expect(onFlag).toHaveBeenCalledTimes(1)

    const deleteButton = screen.getByRole('button', { name: 'Delete' })
    expect(deleteButton).toBeDisabled()
    await user.click(deleteButton)
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('renders nothing when no configured action has a handler', () => {
    const { container } = renderWithProviders(
      <SelectToolbar actions={['flag', 'delete']} handlers={{}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
