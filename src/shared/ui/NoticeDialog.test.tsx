import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { NoticeDialog } from './NoticeDialog'

afterEach(cleanup)

describe('NoticeDialog', () => {
  it('opens from what was reached for, says why, and closes on its one answer', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <NoticeDialog
        trigger={<button type="button">Change algorithm</button>}
        title="Action restricted"
        description="Change this on the main deck."
        acknowledgeLabel="Got it"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Change algorithm' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Action restricted')).toBeInTheDocument()
    expect(within(dialog).getByText('Change this on the main deck.')).toBeInTheDocument()
    expect(within(dialog).getAllByRole('button')).toHaveLength(1)

    await user.click(within(dialog).getByRole('button', { name: 'Got it' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })
})
