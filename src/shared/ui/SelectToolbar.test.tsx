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
        selection={{ exit: () => {} }}
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
        selection={{ exit: () => {} }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Flag' }))
    expect(onFlag).toHaveBeenCalledTimes(1)

    const deleteButton = screen.getByRole('button', { name: 'Delete' })
    expect(deleteButton).toBeDisabled()
    await user.click(deleteButton)
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('renders only the close button when no configured action has a handler', () => {
    renderWithProviders(
      <SelectToolbar actions={['flag', 'delete']} handlers={{}} selection={{ exit: () => {} }} />,
    )
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('ends the selection from a control the header does not already name', async () => {
    const user = userEvent.setup()
    const exit = vi.fn()
    renderWithProviders(<SelectToolbar actions={['flag']} handlers={{}} selection={{ exit }} />)
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Exit select mode' }))
    expect(exit).toHaveBeenCalledTimes(1)
  })
})
