import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

afterEach(cleanup)

function Example({
  onEdit = () => {},
  onDelete = () => {},
  deleteDisabled = false,
}: {
  onEdit?: () => void
  onDelete?: () => void
  deleteDisabled?: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Options</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} disabled={deleteDisabled} variant="destructive">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe('DropdownMenu', () => {
  it('opens a menu and runs the chosen item, then closes', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderWithProviders(<Example onEdit={onEdit} />)

    await user.click(screen.getByRole('button', { name: 'Options' }))
    expect(await screen.findByRole('menu')).toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })

  it('closes on Escape without selecting anything', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderWithProviders(<Example onEdit={onEdit} />)

    await user.click(screen.getByRole('button', { name: 'Options' }))
    expect(await screen.findByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('does not run a disabled item', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderWithProviders(<Example onDelete={onDelete} deleteDisabled />)

    await user.click(screen.getByRole('button', { name: 'Options' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    expect(onDelete).not.toHaveBeenCalled()
  })
})
