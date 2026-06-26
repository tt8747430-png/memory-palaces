import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FlyoutMenu } from './FlyoutMenu'

afterEach(cleanup)

describe('FlyoutMenu', () => {
  it('opens from the trigger and runs the chosen action, then closes', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <FlyoutMenu
        label="More options"
        actions={[
          { id: 'edit', label: 'Edit', onSelect: onEdit },
          { id: 'delete', label: 'Delete', destructive: true, onSelect: onDelete },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /more options/i }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).toBeNull()
  })

  it('skips a disabled action', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <FlyoutMenu
        label="More options"
        actions={[{ id: 'edit', label: 'Edit', disabled: true, onSelect }]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /more options/i }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))

    expect(onSelect).not.toHaveBeenCalled()
  })
})
