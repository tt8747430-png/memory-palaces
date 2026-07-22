import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { OverflowMenuButton } from './OverflowMenuButton'

afterEach(cleanup)

describe('OverflowMenuButton', () => {
  it('opens the overflow menu and runs the chosen action, then closes', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderWithProviders(
      <OverflowMenuButton
        label="More options"
        actions={[{ id: 'edit', label: 'Edit', onSelect: onEdit }]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'More options' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Edit' })).toBeNull())
  })
})
